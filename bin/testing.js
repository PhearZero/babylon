import fs from 'node:fs'
import Redis from 'ioredis'

const redis = new Redis()

const closed = await redis.keys(`addresses:*:closed`)
console.log(closed)
const projects = ["CompX", "TameQuest", "Janus", "Aurally", "DAOWakanda"]
const votes = await redis
    .multi(closed.map(k => ['get', k]))
    .exec()
    .then(
        r => r.map(([_, res], i) => {
            return {
                account: closed[i]
            }
            console.log(res)
        })
    )


console.log(votes)
fs.writeFileSync('./finals.json', JSON.stringify(votes, null, 2))

redis.disconnect()
