import PouchDB from "pouchdb";
import Redis from "ioredis";

export const redis = new Redis()
export const cache = new PouchDB('http://admin:password@localhost:5984/cache')
function emit(key, value) {
    console.log(key, value)
}
// Upload data views to couchdb
await cache.get('_design/analytics').catch(async (e) => {
      if(e.status === 404){
        await cache.put({
          _id: '_design/analytics',
          views: {
            'accounts-info': {
              map: function (doc) {
                if(doc.account){
                  emit(doc._id.slice(0,58), doc.account);
                }
              }.toString(),
            },
            'transactions-by-address': {
              map: function (doc) {
                if(doc.txn){
                  emit(doc._id.slice(0,58), 1);
                }
              }.toString(),
              reduce: '_sum'
            },
            'transactions-close-outs': {
              map: function (doc) {
                if(doc.txn["payment-transaction"] && doc.txn["payment-transaction"].hasOwnProperty('close-remainder-to')){
                  emit(doc.txn["payment-transaction"]["close-remainder-to"], 1);
                }
              }.toString(),
              reduce: '_sum'
            }
          },
          language: 'javascript'
        })
      }
})
