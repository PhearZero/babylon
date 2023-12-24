import {Command} from 'commander';
import {configure, error, HTMXError, write, isCLI} from '../lib/process.js';
import {existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const cmd = configure(new Command('init'), import.meta.url);

cmd
    .description('initialize a new project')
    .argument('<project>', 'project name')
    .argument('[path]', 'path to create project in, defaults to current directory', process.cwd())
    .action((project, path, options) => {
        console.log({project,path,options})
        const fullPath = resolve(path, project);
        console.log(`Creating project ${project} in ${path}`);
        if (existsSync(fullPath)) {
            error(new HTMXError('Directory exists, exiting'), cmd);
        } else {
            mkdirSync(fullPath);
        }
    });

if(isCLI(import.meta.url)){
    cmd.parse();
}

export const init = cmd;
