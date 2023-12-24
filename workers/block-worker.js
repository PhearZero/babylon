import {Worker} from 'bullmq'
import {REDIS_OPTS} from "../bin/lib/constants.js";
import cluster from "node:cluster";
import PouchDB from "pouchdb";
import {PerformanceObserver, performance} from "node:perf_hooks";
import chalk from "chalk";

const obs = new PerformanceObserver((items) => {
    // performance.clearMarks();
});
const SCALE = process.env.SCALE || 2
const id = (cluster.isWorker ? cluster.worker.id : process.pid).toString().padStart(SCALE, '0')

const key = chalk.blue(`[block-worker-${id}]`)

const db = new PouchDB('http://admin:password@localhost:5984/blocks')

function getPaddedDuration(duration){
    let durString = duration.toString()
    if(duration < 10) {
        durString = durString.padStart(durString.length + 3)
    }
    else if(duration < 100){
        // console.log('duration', duration, durString)
        durString = durString.padStart(durString.length + 2)
        // durString = durString.padEnd(durString.length+1)
    }
    else if(duration <= 1000) {
        durString = durString.padStart(durString.length + 1)
    }
    return durString
}
const ALGOD_SERVER = `http://192.168.101.33:8080`
const ALGOD_TOKEN = `4e387b59ced41297b217c9edf39c5170e7a853551d8a22d75c288a7c3788383acm4`
new Worker('blocks',async (job) => {
    // console.log(job.data)
    obs.observe({ type: 'measure' });
    performance.mark('A');
    const blockData = await fetch(`${ALGOD_SERVER}/v2/blocks/${job.data.block}`,{
        headers: {
            'X-Algo-API-Token': ALGOD_TOKEN
        }
    }).then(r=>r.json())
    // console.log(blockData)
    performance.mark('B');
    const nodeDuration = Math.round(performance.measure('A to B', 'A', 'B').duration)
    const {rnd, earn, gen, ts, txn} = blockData.block
    console.log(`${key}: ${chalk[nodeDuration < 60 ? 'green' : nodeDuration < 200 ? 'yellow' : 'red'](`(${getPaddedDuration(nodeDuration)} ms)`)} ${chalk.cyan(JSON.stringify({rnd, earn, gen, ts, txn}))}`)

    blockData._id = `block-${blockData.block.rnd}`
    const dbResult = await db.put(blockData)
    // console.log(dbResult)
    performance.mark('C');

    const message = chalk.cyan(JSON.stringify({...dbResult, ...job.data}))
    const dur = Math.round(performance.measure('B to C', 'B', 'C').duration)
    performance.clearMarks()
    console.log(`${key}: ${chalk[dur < 60 ? 'green' : dur < 200 ? 'yellow' : 'red'](`(${getPaddedDuration(dur)} ms)`)} ${message}`)
}, REDIS_OPTS)
