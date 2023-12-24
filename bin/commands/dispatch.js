import {Command} from 'commander';
import {configure, error, HTMXError, write, isCLI} from '../lib/process.js';
import {existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from "node:url";
const cmd = configure(new Command('dispatch'), import.meta.url);

cmd
    .description('dispatch all events in a project')
    .argument('<project>', 'project name')
    .argument('[script]', 'script to run, defaults to index.js', 'index.js')
    .argument('[path]', 'path to create project in, defaults to current directory', process.cwd())
    .action((project, script, path, options) => {
        const fullPath = resolve(path, project, script);
        console.log(`Dispatching project "${project}" in ${path}`);
        import(pathToFileURL(fullPath))
    });

if(isCLI(import.meta.url)){
    cmd.parse();
}

export const dispatch = cmd;
