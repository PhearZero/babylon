function emit(key, value) {
   console.log(key, value)
}
export const cache = {
"_id": "_design/analytics",
    "views": {
    "accounts-info":{
      "map": function (doc) {
            if(doc.account){
                emit(doc._id.slice(0,58), doc.account);
            }
      }.toString(),
    },
    "transactions-by-address": {
        "map": function (doc) {
            if(doc.txn){
                emit(doc._id.slice(0,58), 1);
            }
        }.toString(),
        "reduce": "_sum"
    },
    "transactions-close-outs": {
        "map": function (doc) {
            if(doc.txn["payment-transaction"] && doc.txn["payment-transaction"].hasOwnProperty('close-remainder-to')){
                emit(doc.txn["payment-transaction"]["close-remainder-to"], 1);
            }
        }.toString(),
        "reduce": "_sum"
    }
},
"language": "javascript"
}
