import Redis from 'ioredis';
import {Queue, Worker} from 'bullmq';
import {fetchAll} from './lib/utils.js'
import {QUEUE_OPTS, REDIS_OPTS, NODE_URL} from "./lib/constants.js";
import frauds from './frauds.json' assert {type: 'json'}
const connection =  {host: "localhost"}
const q = new Queue('process-valid-accounts', REDIS_OPTS)
const redis = new Redis()
const TXN_URL = `${NODE_URL}/v2/transactions`

// TODO: Fetch all known bad actors, trace their history to voters
// TODO: Fetch all voting accounts and transaction history between each other.

// Known list of bot accounts, first transaction of many accounts that have been closed
const knownOffenders = [
    "FRAUDD77SWCXYGJZS7G5GTNISGWQMM3JEIJIUNGOT64CTG25DJNA45EB7Y",
    "HFKAURI5Q6KC6IHKX4VBV6YYZJNQ7WLQUINSM2HDF6UYJWZULREZVDF5HQ",
    "PJB7E4FCGTO4COTNNTASO3S2CZF4RKEW4XIH2GRKNDQC372GRVSOZEG22U",
    "K3PDDOJ4WTSEQ3AXQTXQBRGWUVCDYHG3VXWVKFP26H2FU4OOLO5MQD4DVM",
    "XYRBD5RCNJMFG5BZBCYUP66PPPJ3WILEM5E2BV2XI4F3JAV7ESCACBORJY",
    "QYXDGS2XJJT7QNR6EJ2YHNZFONU6ROFM6BKTBNVT63ZXQ5OC6IYSPNDJ4U",
    "FAUC7F2DF3UGQFX2QIR5FI5PFKPF6BPVIOSN2X47IKRLO6AMEVA6FFOGUQ",
    "5KOICB2OKDCALDOMS5EOTMN37H2ACRC6CCULJ5VX5O6EOVQFTXIP6DID3U",
    "JZ3GFSWHKR46BDFDCUDMQWVFJ5TO4MZPOQ4TIVVWUWT3G5XOWGHF7VHVZI",
    "2F6R6FFX5653X64NUSXALYCGGXZDBBGNORREQ5BZDRVW4JDBJ5AHOC3SZQ",
    "U7EUN25Y3UBLBUE5DKC4ZNYCMJSOIPSFMGMPPOSFWCW4IL72YTMKEXMNBU",
    "E6HUOCIWONLD2CBU6Z45OY7CQOWAVXGNFKCS77MZSGV6I2KKMFRJMQ4JRY",
    "2IZ4A4RUTTLW2UFINGILDIO3AHHMLWLCILYPXOREVMQ5RPAGC5AT4HS54I",
    "KLLTU6JNZRLDFOEI6K4RBU2YSP3SUWL4CGRMO33EA3F7P2QJ7IXATHY2GY",
    "5GW5VO4JNTHXVH2DYV7HAKBKGQFSCAI4MBUD5EN3FLBGLF4KKRXJE24ASI",
    ...frauds
]

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
    const fraudAccounts = knownOffenders.filter((acc) => {
        console.log(txnSenders)
        console.log(acc, txnSenders.includes(acc))
        return txnSenders.includes(acc)
    })
    const isInvalid = fraudAccounts.length > 0 || fraudAccounts.includes(sender)

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
