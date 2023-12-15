import fs from 'node:fs'
import Redis from 'ioredis'

const redis = new Redis()

const valid = await redis.keys(`valid:*`)
const projects = ["CompX", "TameQuest", "Janus", "Aurally", "DAOWakanda"]
const votes = await redis
    .multi(valid.map(k => ['get', k]))
    .exec()
    .then(
        r => r.map(([_, res]) => {
            const choice = JSON.parse(res)[3]
            const bytes = atob(choice)
            return bytes.split('').map(c => c.charCodeAt(0)).slice(2)
        }).reduce((curr, next) => {
            next.forEach((v, i) => {
                const key = projects[i]
                if (typeof curr[key] === 'undefined') {
                    curr[key] = 0
                }
                curr[key] += v === 0 ? 1 : 0
            })
            return curr
        },{})
    )


console.log(votes)
fs.writeFileSync('./finals.json', JSON.stringify(votes, null, 2))

redis.disconnect()
