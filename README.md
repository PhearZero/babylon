# Babylon Stream Processing
> Stream processing for the Bab vote

## Getting Started

```shell
docker-compose up -d
npm install
# Edit ./bin/cluster to set the number of workers
npm run start
```

Open http://localhost:8081 to see the redis state

### Update Frauds

```shell
npm run update-frauds-json
```

### Tabulate Votes

```shell
npm run tabulate-votes
```

## ./bin/process-bab-transactions-worker.js

1. Reads the known `frauds.json` file.
2. Reads the individual BAB transactions from the broker.
3. Fetches voter's complete transaction history prior to the vote.
4. Checks if the voter has received a transaction from a known bot/bad actor.
   1. If yes, the vote is rejected.
   2. If no, the vote is queued to be verified by the ./bin/process-valid-votes-worker.js

## ./bin/process-valid-votes-worker.js

1. Reads the valid vote from the transaction worker
2. Checks the account for any close outs and invalidates the vote if any are found.

## ./bin/save-fraud-accounts.js

1. Reads the invalid votes and the close-outs to update the `frauds.json` file.
   1. If the frauds file has changed, clear the cache and rerun the analysis to ensure all votes are verified with the updated list

## ./bin/tabulate-valid-votes.js

1. Reads the state of `validated` voters and tabulates the results
