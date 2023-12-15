import Redis from 'ioredis';
import {Worker} from 'bullmq';
import {REDIS_OPTS, NODE_URL} from "./lib/constants.js";

const redis = new Redis()
const ACCOUNT_URL = `${NODE_URL}/v2/accounts`

new Worker("process-valid-accounts", async (job) => {
    const {sender, args} = job.data
    const isValidated = await redis.get(`validated:${sender}`).catch(()=>null)
    const isSneaky = await redis.get(`close-outs:${sender}`).catch(()=>null)
    // Already processed
    if(isValidated || isSneaky ){
        console.log(`${sender} has already been processed`)
        return
    }

    // List of all senders with duplicates
    const results = await fetch(`${ACCOUNT_URL}/${sender}`).then(r=>r.json()).catch(()=>null)
    if(!results || typeof results.account === 'undefined'){
        await redis.set(`close-outs:${sender}`, "true")
    } else {
        await redis.set(`validated:${sender}`, JSON.stringify(args))
    }
    console.log(`Finished ${sender}`);
}, REDIS_OPTS);
