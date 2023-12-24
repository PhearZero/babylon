export const ALGOD_TOKEN = process.env.ALGOD_TOKEN || ''
export const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://xna-mainnet-api.algonode.cloud'
export const ALGOD_PORT = process.env.ALGOD_PORT || 443
export const QUEUE_OPTS = { removeOnComplete: true, attempts: 3 }

export const NODE_URL = 'https://mainnet-idx.algonode.cloud'

export const REDIS_OPTS= { connection: {
        host: 'localhost'
    }
}
export const APP_ID = 1272433669
