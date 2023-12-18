import {Worker} from 'bullmq';
import {fetchAll} from './lib/utils.js'
import {NODE_URL, REDIS_OPTS} from "./lib/constants.js";
import {cache, redis} from './lib/services.js'

const TXN_URL = `${NODE_URL}/v2/transactions`
const ACCOUNT_URL = `${NODE_URL}/v2/accounts`

new Worker("process-bab-transactions", async (job) => {
    const {sender, block, args} = job.data

    const accountInfo = await handleAccountInfo(sender, block)
    const isClosedOut = (!accountInfo || typeof accountInfo === 'undefined')

    const results = await handleAccountTransactions(sender, block)

    const payments = results.filter((txn) => txn.type !== 'pay')

    const closeouts = payments.filter((txn) => txn['payment-transaction'].hasOwnProperty('close-remainder-to'))

    if(closeouts.length > 0){
        console.log(`${sender} has closed out`)
    }
    if(isClosedOut){
        await redis.set(`close-outs:${sender}`, isClosedOut)
    }
    await redis.multi([
        ...closeouts.map((txn) => ['set', `close-to:${txn['payment-transaction']['close-remainder-to']}`, isClosedOut])
    ]).exec()
    //
    // const txnSenders = Object.keys(txnSenderCounts)
    // const fraudAccounts = knownOffenders.filter((acc) => txnSenders.includes(acc))
    // const isInvalid = fraudAccounts.length > 0 || knownOffenders.includes(sender) || isClosedOut
    //
    // // Add valid voter for further verification
    // // if(!isInvalid){
    // //     await q.add("valid-voter", {sender, args}, QUEUE_OPTS)
    // // }
    //
    // const sorted = isInvalid ?
    //     ['set',`frauds:${sender}`, JSON.stringify({fraudAccounts, args})] :
    //     ['set', `valid:${sender}`, JSON.stringify(args)]
    //
    // // Set State
    // await redis.multi([
    //     ['hset', `addresses:${sender}:info`, isClosedOut ? {} : accountInfo],
    //     ['set', `addresses:${sender}:block`, block],
    //     ['set', `addresses:${sender}:closed`, isClosedOut],
    //     ['set', `addresses:${sender}:fraudAccounts`, JSON.stringify(fraudAccounts)],
    //     ['set', `addresses:${sender}:isInvalid`, isInvalid],
    //     ['set', `addresses:${sender}:arguments`, JSON.stringify(args)],
    //     ...txnSenders.map(k => ['hset', `addresses:${sender}:associations:${k}`, {count: txnSenderCounts[k]}]),
    //     sorted,
    // ]).exec()
    //
    //
    // console.log(`${sender} has received txns from ${Object.keys(txnSenders).length} accounts`)
}, REDIS_OPTS);

/**
 * Cache to save on API calls
 * @param sender
 * @param block
 * @return {Promise<*>}
 */
async function handleAccountInfo(sender, block) {
    return await cache.get(`${sender}:info`).then((doc) => doc.account).catch(async (e) => {
        if (e.status === 404) {
            console.log(`Working on ${ACCOUNT_URL}/${sender}?round=${block}`)
            const accountInfo = await fetch(`${ACCOUNT_URL}/${sender}?round=${block}`).then(r => r.json()).catch(() => null)
            const isClosedOut = (!accountInfo || typeof accountInfo === 'undefined')
            await cache.put({
                _id: `${sender}:info`,
                block: block,
                account: isClosedOut ? false : accountInfo.account
            })
            return !isClosedOut ? accountInfo.account : undefined
        } else {
            throw e;
        }
    })
}

/**
 * Cache to save on api calls
 * @param sender
 * @param block
 * @return {Promise<Array>}
 */
async function handleAccountTransactions(sender, block) {
    return await cache.query('analytics/transactions-by-address', {key: sender, include_docs: true, reduce: false})
        .then((docs) => docs.rows.map((row) => row.doc.txn))
        .then(async (txns) => {
            if (txns.length !== 0) {
                return txns
            }
            const results = await fetchAll(`${TXN_URL}?address=${sender}&address-role=receiver&max-round=${block}`, (r) => r.flatMap(r => r.transactions))

            await redis.hset(`funder:${results[results.length - 1].id}`, {sender, funder: results[results.length - 1].sender})
            await cache.bulkDocs(results.map(txn => {
                return {
                    _id: `${sender}:${txn.id}`,
                    block: block,
                    txn,
                }
            }))
            return results
        })
}
