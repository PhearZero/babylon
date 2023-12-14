const os = require('node:os');
const total = os.cpus().length

module.exports = {
    apps: [
        {
            name: 'Bab Transactions',
            script: './bin/dispatch-transactions-broker.js',
        },
        {
            name: 'Process Transaction',
            instances: total,
            script: './bin/process-bab-transactions-worker.js',
        },
        {
            name: 'Validate Voter',
            script: './bin/process-valid-votes-worker.js',
        }
    ]
}
