import {Queue} from 'bullmq';
import {fetchAll} from './lib/utils.js'
import {APP_ID, QUEUE_OPTS, REDIS_OPTS, NODE_URL} from "./lib/constants.js";

const LIMIT = 1000
const txnsUrl = `${NODE_URL}/v2/transactions?application-id=${APP_ID}&tx-type=appl&limit=${LIMIT}`

const q = new Queue('process-bab-transactions', REDIS_OPTS);

await fetchAll(txnsUrl).then(async (result) => {
    await Promise.all(result.map(async (data) => {
        await q.addBulk(data.transactions.map(
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
    }))
})
