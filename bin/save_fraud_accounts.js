import fs from 'fs'
import Redis from 'ioredis'

const redis = new Redis()

/**
 * From BabFraud Analysis
 * @type {string[]}
 */
const knownBadActors = [
    // "FRAUDD77SWCXYGJZS7G5GTNISGWQMM3JEIJIUNGOT64CTG25DJNA45EB7Y",
    // "HFKAURI5Q6KC6IHKX4VBV6YYZJNQ7WLQUINSM2HDF6UYJWZULREZVDF5HQ",
    // "PJB7E4FCGTO4COTNNTASO3S2CZF4RKEW4XIH2GRKNDQC372GRVSOZEG22U",
    // "K3PDDOJ4WTSEQ3AXQTXQBRGWUVCDYHG3VXWVKFP26H2FU4OOLO5MQD4DVM",
    // "XYRBD5RCNJMFG5BZBCYUP66PPPJ3WILEM5E2BV2XI4F3JAV7ESCACBORJY",
    // "QYXDGS2XJJT7QNR6EJ2YHNZFONU6ROFM6BKTBNVT63ZXQ5OC6IYSPNDJ4U",
    // "FAUC7F2DF3UGQFX2QIR5FI5PFKPF6BPVIOSN2X47IKRLO6AMEVA6FFOGUQ",
    // "5KOICB2OKDCALDOMS5EOTMN37H2ACRC6CCULJ5VX5O6EOVQFTXIP6DID3U",
    // "JZ3GFSWHKR46BDFDCUDMQWVFJ5TO4MZPOQ4TIVVWUWT3G5XOWGHF7VHVZI",
    // "2F6R6FFX5653X64NUSXALYCGGXZDBBGNORREQ5BZDRVW4JDBJ5AHOC3SZQ",
    // "U7EUN25Y3UBLBUE5DKC4ZNYCMJSOIPSFMGMPPOSFWCW4IL72YTMKEXMNBU",
    // "E6HUOCIWONLD2CBU6Z45OY7CQOWAVXGNFKCS77MZSGV6I2KKMFRJMQ4JRY",
    // "2IZ4A4RUTTLW2UFINGILDIO3AHHMLWLCILYPXOREVMQ5RPAGC5AT4HS54I",
    // "KLLTU6JNZRLDFOEI6K4RBU2YSP3SUWL4CGRMO33EA3F7P2QJ7IXATHY2GY",
    // "5GW5VO4JNTHXVH2DYV7HAKBKGQFSCAI4MBUD5EN3FLBGLF4KKRXJE24ASI",
]

const frauds = await redis.keys(`frauds:*`)
const closed = await redis.keys(`close-outs:*`)

function mapAddr(s){
    return s.split(':')[1]
}

fs.writeFileSync('./frauds.json', JSON.stringify([...knownBadActors, ...frauds.map(mapAddr), ...closed.map(mapAddr)], null, 2))

redis.disconnect()
