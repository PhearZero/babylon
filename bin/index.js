#! /usr/bin/env node

import cluster from 'node:cluster';
import {program} from 'commander';
import {configure} from './lib/process.js';
import * as COMMANDS from './commands/index.js';

Object.keys(COMMANDS).forEach((k)=>{
    program.addCommand(COMMANDS[k]);
});

configure(program, import.meta.url).parse();
