import {ALGOD_SERVER, ALGOD_PORT, ALGOD_TOKEN, REDIS_OPTS, QUEUE_OPTS} from '../bin/lib/constants.js'
// import PouchDB from "pouchdb";
import progress from 'cli-progress'
import {Queue} from "bullmq";

const q = new Queue("blocks", REDIS_OPTS);

const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
const algodStatus = await fetch(`${ALGOD_SERVER}:${ALGOD_PORT}/v2/status`).then(res => res.json())
let block = 0;
bar.start(algodStatus['last-round'], block);
async function loop(){
    const blockStatus = await fetch(`${ALGOD_SERVER}:${ALGOD_PORT}/v2/status/wait-for-block-after/${block}`, {
        headers: {
            'X-Algo-API-Token': ALGOD_TOKEN
        }
    }).then(res => res.json())
    console.log(blockStatus)
    await q.add(`block-${block}`, {block}, QUEUE_OPTS)
    // const blockData = await fetch(`${ALGOD_SERVER}:${ALGOD_PORT}/v2/blocks/${block}`, {
    //     headers: {
    //         'X-Algo-API-Token': ALGOD_TOKEN
    //     }
    // }).then(res => res.json())
    // console.log(blockData)
    // blockData._id = blockData.rnd
    // await db.post(blockData)
    // console.log({blockStatus, block, apiStatus})
    // console.log({block})
    block += 1
    bar.update(block)
    loop()
}
// loop()
if(block < algodStatus['last-round']){
    for(let i = block; i < algodStatus['last-round']; i++){
        await q.add(`block-${i}`, {block: i}, QUEUE_OPTS)
        bar.update(i)
    }
    loop()
} else {
    loop()
}

