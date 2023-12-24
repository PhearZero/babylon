import {Command} from 'commander';
import {configure, error, HTMXError, write, isCLI} from '../lib/process.js';
import {unlinkSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import { availableParallelism } from 'node:os';
import process from 'node:process';

import cluster from "node:cluster";
import gradient from "gradient-string";
const cmd = configure(new Command('workers'), import.meta.url);
const numCPUs = availableParallelism();

const pidPath = resolve(process.cwd(), 'cluster.pid');
if(cluster.isPrimary){
    process.once('SIGINT', function (code) {
        if( existsSync(pidPath)){
            unlinkSync(pidPath);
        }
    });
}

cmd
    .description('watch all events in a project')
    .argument('<project>', 'project name')
    .argument('[script]', 'script to run, defaults to index.js', 'index.js')
    .argument('[scale]', 'script to run, defaults to number of CPUs', numCPUs)
    .argument('[path]', 'path to create project in, defaults to current directory', process.cwd())
    .action(async (project, script, scale, path, options) => {
        const fullPath = resolve(path, project, script);
        if (cluster.isPrimary) {
            if(existsSync(pidPath)){
                error(new HTMXError('Cluster already running'), cmd);
            }
            write([gradient.summer('Cluster master'), gradient('red', 'pink')(process.pid), gradient.summer('is running')].join(' '))
            writeFileSync(process.cwd() + '/cluster.pid', process.pid.toString())
            // Fork workers.
            for (let i = 0; i < scale; i++) {
                cluster.fork();
            }
            cluster.on('exit', (worker) => {
                console.log(`worker ${worker.process.pid} died`);
            });
        } else {
            const key = gradient.retro(`[babylon-worker-${cluster.worker.id.toString().padStart(scale.toString().length, '0')}]`)
            const message = gradient.cristal(`Loading ${project}/${script}`)
            process.env.WORKER_COUNT= scale;
            console.log(`${key}: ${message}`)
            await import(pathToFileURL(fullPath))
        }
    });

if(isCLI(import.meta.url)){
    // console.log('parse', process.argv)
    cmd.parse();
}

export const workers = cmd;
