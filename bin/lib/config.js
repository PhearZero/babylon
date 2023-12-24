import dotenv from 'dotenv';
import {createRequire} from 'node:module';
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
dotenv.config();
const require = createRequire(import.meta.url);

const CONFIG = {
    htmx: {
        database: 'hypertext',
        design: '_design/htmx',
        banner: true,
        prompt: 'A good way to relax is to',
    },
    couchdb: {
        'database_dir': process.cwd() + '/.data/',
    },
    httpd: {
        port: 5984,
        host: '127.0.0.1',
    },
    // vhosts:{
    //     "htmx.local:5984": "/hypertext/_design/htmx/_rewrite/"
    // }
};
export const config = fs.existsSync(process.cwd() + '/config.json') ?
    _.merge( CONFIG, require(process.cwd() + '/config.json')) :
    CONFIG;

export const pkg = fs.existsSync(process.cwd() + '/package.json') ?
    _.merge( CONFIG, require(process.cwd() + '/package.json')) :
    CONFIG;
// TODO: make sure CLI can output this somewhere
// export function show() {
//   process.stdout.write(`🔥 ${chalk.magenta('Application')} => http://${config.httpd.host}:${config.httpd.port}/${config.htmx.database}/${config.htmx.design}/_rewrite/\n`);
//   process.stdout.write(`❤️ ${chalk.magenta('Database')} => http://${config.httpd.host}:${config.httpd.port}/_utils/\n\n`);
// }
