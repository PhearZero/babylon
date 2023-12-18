import {Queue} from 'bullmq';
import {fetchAll} from './lib/utils.js'
import {APP_ID, QUEUE_OPTS, REDIS_OPTS, NODE_URL} from "./lib/constants.js";
import {redis} from './lib/services.js'

const LIMIT = 1000
const txnsUrl = `${NODE_URL}/v2/transactions?application-id=${APP_ID}&tx-type=appl&limit=${LIMIT}`

const q = new Queue('process-bab-transactions', REDIS_OPTS);

// Cache txns in redis, re-add to queue for workers
const txns = await getTxnsFromRedis()
if(txns.length > 0){
    await addTxnsToQueue(txns)
} else {
    await fetchAll(txnsUrl).then(async (result) => {
        await Promise.all(result.map(async (data) => {
            await saveTxnsToRedis(data.transactions)
            await addTxnsToQueue(data.transactions)
        }))
    })
}

await q.close()
await redis.disconnect()

async function addTxnsToQueue(txns){
    return q.addBulk(txns.map(
        (txn) => ({
            name: "bab-txn",
            opts: QUEUE_OPTS,
            data: {
                sender: txn.sender,
                block: txn["confirmed-round"],
                args: txn["application-transaction"]["application-args"]
            }
        })
    ))
}

async function saveTxnsToRedis(txns){
    return redis.multi(
        txns.map((txn) => ['set', `cache:txn:${txn.id}`, JSON.stringify(txn)])
    ).exec()
}

async function getTxnsFromRedis(){
    return redis.keys(`cache:txn:*`).then((keys) => {
        return redis.multi(
            keys.map((key) => ['get', key])
        ).exec()
    }).then((results) => {
        return results.map(([_, res]) => JSON.parse(res))
    })
}


