import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

import {Command} from 'commander';
import gradient from 'gradient-string';
import chalk from 'chalk';

import {config} from './config.js';
import {talk} from './ai.js';
import cluster from "node:cluster";

/**
 * @typedef import('commander').OutputConfiguration OutputConfiguration
 */


/**
 * @typedef import('commander').Help Help
 */


const {magenta, yellow, red, blue, green} = chalk;

const require = createRequire(import.meta.url);
export const pkg = require('../../package.json');

export const BABYLON = `
██████╗  █████╗ ██████╗ ██╗   ██╗██╗      ██████╗ ███╗   ██╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██║     ██╔═══██╗████╗  ██║
██████╔╝███████║██████╔╝ ╚████╔╝ ██║     ██║   ██║██╔██╗ ██║
██╔══██╗██╔══██║██╔══██╗  ╚██╔╝  ██║     ██║   ██║██║╚██╗██║
██████╔╝██║  ██║██████╔╝   ██║   ███████╗╚██████╔╝██║ ╚████║
╚═════╝ ╚═╝  ╚═╝╚═════╝    ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝                                                      
`
export const BANNER_FOOTER = `${gradient.morning(`OS: ${os.type()}`)}, ` +
    `${gradient.morning(`Version: ${pkg.version}`)}, ` +
    `${gradient.morning(`Host: ${config.httpd.host}`)}, ` +
    `${gradient.morning(`Port: ${config.httpd.port}`)} \n`;
export const BANNER = gradient.rainbow.multiline(BABYLON) + BANNER_FOOTER
/**
 * Format Help
 *
 * @param {Command} cmd
 * @param {Help} helper
 * @return {string}
 */
export function formatHelp(cmd, helper) {
  if (isQuiet(cmd)) {
    return '';
  }

  // Check if it is help cmd
  const flags = ['help', ...cmd._helpFlags.split(', ')];
  const isHelp = flags.some((i) =>cmd.args.includes(i)) || flags.some((i)=>cmd.parent?.args.includes(i));

  // Either help, empty arguments, or quiet is not specified
  const showBanner = (isHelp || process.argv.length === 2 && cluster.isPrimary);

  let output = showBanner ? [BANNER]: [];

  const termWidth = helper.padWidth(cmd, helper);
  const helpWidth = helper.helpWidth || 80;
  const itemIndentWidth = 2;
  const itemSeparatorWidth = 2; // between term and description
  function formatItem(term, description) {
    if (description) {
      const fullText = `${gradient.vice(term.padEnd(termWidth + itemSeparatorWidth))}${gradient.summer(description)}`;
      return fullText;
      // return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
    }
    return green(term);
  }
  function formatList(textArray) {
    return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth));
  }

  // Usage
  output = output.concat(`${gradient('pink', 'magenta')('📝 Usage:')} ${gradient.fruit(helper.commandUsage(cmd))}\n`);

  // Description
  const commandDescription = helper.commandDescription(cmd);
  if (commandDescription.length > 0) {
    output = output.concat([helper.wrap(commandDescription, helpWidth, 0), '']);
  }

  // Arguments
  const argumentList = helper.visibleArguments(cmd).map((argument) => {
    return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
  });
  if (argumentList.length > 0) {
    output = output.concat([gradient('pink', 'magenta')('🔧 Arguments:'), formatList(argumentList), '']);
  }

  // Options
  const optionList = helper.visibleOptions(cmd).map((option) => {
    return formatItem(helper.optionTerm(option), helper.optionDescription(option));
  });
  if (optionList.length > 0) {
    output = output.concat([gradient('pink', 'magenta')('🚩 Options:'), formatList(optionList), '']);
  }

  if (this.showGlobalOptions) {
    const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
      return formatItem(helper.optionTerm(option), helper.optionDescription(option));
    });
    if (globalOptionList.length > 0) {
      output = output.concat([gradient('pink', 'magenta')('Global Options:'), formatList(globalOptionList), '']);
    }
  }

  // Commands
  const commandList = helper.visibleCommands(cmd).map((cmd) => {
    return formatItem(helper.subcommandTerm(cmd), helper.subcommandDescription(cmd));
  });
  if (commandList.length > 0) {
    output = output.concat([gradient('pink', 'magenta')('🚀 Commands:'), formatList(commandList), '']);
  }

  return output.join('\n');
}

/**
 * Is Running as CLI
 *
 * Checks is script is a subcommand
 *
 * @param {string} url
 * @return {boolean}
 */
export function isCLI(url) {
  return path.resolve(process.argv[1]) === path.resolve(fileURLToPath(url));
}

/**
 * Is Command Quite
 *
 * @param {Command} cmd
 * @return {boolean}
 */
export function isQuiet(cmd) {
  const opts = cmd.opts();
  return typeof opts.quiet !== 'undefined' && opts.quiet;
}
export function isError(cmd) {
    const opts = cmd.opts();
    return typeof opts.error !== 'undefined' && opts.error;
}
/**
 * Get Output Configuration
 *
 * @param {Command} cmd
 * @return {*}
 */
export function getOutputConfig(cmd) {
  return {
    /**
         *
         * @param {string} str
         */
    writeOut(str) {
      if (!isQuiet(cmd)) {
        process.stdout.write(str);
      }
    },
    /**
         *
         * @param {string} str
         */
    writeErr(str) {
      if (isError(cmd) || !isQuiet(cmd)) {
        process.stderr.write(str);
      }
    },
    /**
     *
     * @param {string} str
     * @param {function} write
     */
    outputError(str, write) {
      write(
                // !isQuiet(cmd) ?
                //     BANNER + '\n' + gradient('red', 'deeppink')(str) :
                    gradient('red', 'deeppink')(str),
      );
    },
  };
}

/**
 * Configure Commands
 *
 * @param {Command} cmd
 * @param {string} url
 * @throws TypeError
 * @return {Command}
 */
export function configure( cmd, url) {
  if (!(cmd instanceof Command)) {
    throw new TypeError('cmd must be instance of Command!');
  }

  if (typeof url !== 'string') {
    throw new TypeError('url must be instance of URL!');
  }

  cmd
      .configureOutput(getOutputConfig(cmd))
      .showHelpAfterError(true)
      .configureHelp({formatHelp})
      .option('-d, --debug', 'debugging log level')
      .option('-e, --error', 'error only log level')
      .option('-v, --verbose', 'verbose log level')
      .option('-q, --quiet', 'silent log level')
  // If the command is stand-alone, configure the output and parse
  if (isCLI(url)) {
    // Compose Name
    const name = typeof cmd._name !== 'undefined' && cmd._name !== '' ? ` ${cmd._name}` : '';
    // Patch Description
    if (typeof cmd._description === 'undefined' || cmd._description === '') {
      cmd.description(pkg.description);
    }
    cmd
        .name(pkg.name + name)
        .hook('preAction', ()=>{
          if (!isQuiet(cmd) && cluster.isPrimary ) {
            process.stdout.write(BANNER + '\n');
          }
        })
        .version(pkg.version)
  }

  return cmd;
}

/**
 * HTMX Error
 */
export class HTMXError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HTMXError';
  }
}
/**
 * Error Handler
 *
 * Strips output
 *
 * @param {Error} err
 * @param {Command} [cmd]
 */
export function error( err, cmd ) {
  if (cmd instanceof Command) {
    cmd
        .showHelpAfterError(false)
        .configureOutput(getOutputConfig(cmd))
        .error(err.message);
  } else {
    process.stderr.write(
        `${chalk.redBright(err.name)}: ${chalk.yellowBright(err.message)}\n`,
    );
    process.exit(1);
  }
}
export function write( str, cmd ) {
    if (cmd instanceof Command) {
        cmd
            .showHelpAfterError(false)
            .configureOutput(getOutputConfig(cmd))
            .writeOut(str);
    } else {
        process.stdout.write(`${str}\n`);
    }
}
const asyncIntervals = [];

const runAsyncInterval = async (cb, interval, intervalIndex) => {
  await cb();
  if (asyncIntervals[intervalIndex]) {
    setTimeout(() => runAsyncInterval(cb, interval, intervalIndex), interval);
  }
};


/**
 * This callback type is called `requestCallback` and is displayed as a global symbol.
 *
 * @callback asyncInterval
 */

/**
 * Asyncronis setInterval
 * @param {asyncInterval} cb
 * @param {number} interval
 * @return {number}
 */
export const setAsyncInterval = (cb, interval) => {
  if (cb && typeof cb === 'function') {
    const intervalIndex = asyncIntervals.length;
    asyncIntervals.push(true);
    runAsyncInterval(cb, interval, intervalIndex);
    return intervalIndex;
  } else {
    throw new TypeError('Callback must be a function');
  }
};

/**
 * Clear Async Interval
 *
 * @param {number} intervalIndex
 */
export const clearAsyncInterval = (intervalIndex) => {
  if (asyncIntervals[intervalIndex]) {
    asyncIntervals[intervalIndex] = false;
  }
};

/**
 * Remove terminal cursor
 */
export function noCursor() {
  process.stdout.write('\u001B[?25l');
}

/**
 * Write Header to stdout
 */
export function header() {
  noCursor();
  process.stdout.write(BANNER + '\n');
}

export function metadata(_config=config) {
  const {httpd, htmx} = _config;
  process.stdout.write(`❤️‍ ${chalk.magentaBright('Application')} => http://${httpd.host}:${httpd.port}/${htmx.database}/${htmx.design}/_rewrite/\n`);
  process.stdout.write(`⚡️ ${chalk.magentaBright('Database')} => http://${httpd.host}:${httpd.port}/_utils/\n\n`);
}
export function footer(
    prompt=config.htmx.prompt,
    interval=typeof process.env.HF_ACCESS_TOKEN === 'undefined' ? 60000 : 30000,
) {
  process.stdout.write(`${chalk.magentaBright('Time to Relax')}™️\n`);

  return talk(prompt, async (_text)=>{
    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
    process.stdout.write(
        `${chalk.yellowBright('>')} ${chalk.greenBright(_text)}` + process.stdout.isTTY ? '' : '\n',
    );
  }, interval);
}
