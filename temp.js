import {redis} from './bin/lib/services.js'

const voters = await redis.keys(`cache:txn:*`).then((keys) => {
    return redis.multi(
        keys.map((key) => ['get', key])
    ).exec()
        .then((results) => {
            return results.map(([_, res]) => JSON.parse(res).sender)
        })
})
const funding =  await redis.keys(`funder:*`).then((keys) => {
    return redis.multi(
        keys.map((key) => ['hget', key, 'sender'])
    )
    .exec()
    .then((results) => {
        return results.map(([_, res]) => res)

    })
})
// console.log(funding)
const missing = voters.filter((key)=>{
    console.log(key, funding.includes(key))
    return funding.includes(key)
})
 console.log(missing.length, keys.length, funding.length)
console.log(missing)
