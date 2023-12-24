import {Worker} from 'bullmq'
import {REDIS_OPTS} from "../bin/lib/constants.js";
import cluster from "node:cluster";
import gradient from "gradient-string";
import PouchDB from "pouchdb";
import {PerformanceObserver, performance} from "node:perf_hooks";
import chalk from "chalk";
const obs = new PerformanceObserver((items) => {
    // console.log(items.getEntries()[0].duration);
    performance.clearMarks();
});
const SCLAE = process.env.SCALE || 2
const id = (cluster.isWorker ? cluster.worker.id : process.pid).toString().padStart(SCLAE, '0')
// const key = gradient.pastel(`[placeholder-worker-${id}]`)
const key = chalk.blue(`[placeholder-worker-${id}]`)

const db = new PouchDB('http://admin:password@localhost:5984/placeholder')
new Worker('placeholder',async (job) => {
    obs.observe({ type: 'measure' });
    // performance.measure('Start to Now');
    performance.mark('A');
    // const message = gradient.cristal(JSON.stringify(job.data))
    await db.post(job.data)

    performance.mark('B');
    const message = chalk.cyan(JSON.stringify(job.data))
    const dur = Math.round(performance.measure('A to B', 'A', 'B').duration)
    console.log(`${key}: ${message} ${chalk[dur < 60 ? 'green' : dur < 200 ? 'yellow' : 'red'](`(${dur}ms)`)}`)
}, REDIS_OPTS)
