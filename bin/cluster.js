import fs from 'node:fs';
import path from 'node:path';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';

const numCPUs = availableParallelism();

if (process.argv.length === 2) {
    console.error('Must specify a script to run!');
    process.exit(1);
}

if(!fs.existsSync(process.argv[2])){
    console.error(`Script ${process.argv[2]} does not exist!`);
    process.exit(1);
}

if (cluster.isPrimary) {
    // Fork workers.
    for (let i = 0; i < numCPUs - 2; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    import(path.resolve(process.argv[2]))
}
