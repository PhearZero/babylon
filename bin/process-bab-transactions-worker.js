import Redis from 'ioredis';
import {Queue, Worker} from 'bullmq';
import {fetchAll} from './lib/utils.js'
import {QUEUE_OPTS, REDIS_OPTS, NODE_URL} from "./lib/constants.js";
import knownOffenders from './frauds.json' assert {type: 'json'}
const connection =  {host: "localhost"}
const q = new Queue('process-valid-accounts', REDIS_OPTS)
const redis = new Redis()
const TXN_URL = `${NODE_URL}/v2/transactions`

new Worker("process-bab-transactions", async (job) => {
    const {sender, block, args} = job.data

    // Already processed
    if(await redis.get(`voters:${sender}:arguments`).catch(()=>null) !== null ){
        console.log(`${sender} has already been processed`)
        return
    }

    // List of all senders with duplicates
    const results = await fetchAll(`${TXN_URL}?address=${sender}&address-role=receiver&max-round=${block}`, (r)=>r.flatMap(r => r.transactions.map(txn => txn.sender)))

    // Reduce all senders to a Dictionary of Transaction Counts
    const txnSenderCounts = results.reduce((curr, next) => {
            if (typeof curr[next] === "number") {
                curr[next] += 1
            } else {
                curr[next] = 1
            }
            return curr
        }, {})

    const txnSenders = Object.keys(txnSenderCounts)
    const fraudAccounts = knownOffenders.filter((acc) => txnSenders.includes(acc))
    const isInvalid = fraudAccounts.length > 0 || knownOffenders.includes(sender)

    // Add valid voter for further verification
    if(!isInvalid){
        await q.add("valid-voter", {sender, args}, QUEUE_OPTS)
    }

    const sorted = isInvalid ?
        ['set',`frauds:${sender}`, JSON.stringify({fraudAccounts, args})] :
        ['set', `valid:${sender}`, JSON.stringify(args)]

    // Set State
    await redis.multi([
        ['set', `voters:${sender}:fraudAccounts`, JSON.stringify(fraudAccounts)],
        ['set', `voters:${sender}:isInvalid`, isInvalid],
        ['set', `voters:${sender}:arguments`, JSON.stringify(args)],
        ...txnSenders.map(k => ['hset', `voters:${sender}:${k}`, {count: txnSenderCounts[k]}]),
        sorted,
    ]).exec()


    console.log(`${sender} has received txns from ${Object.keys(txnSenders).length} accounts`)
}, {connection});
