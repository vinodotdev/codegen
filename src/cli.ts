#!/usr/bin/env node

import { debug } from './common';
import yargs from 'yargs';

debug('Starting');
try {
  yargs(process.argv.slice(2))
    .commandDir('languages')
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .wrap(yargs.terminalWidth()).argv;
  debug('Done processing command');
} catch (e) {
  debug('Error %o', e);
  console.error(`Error arguments : ${e.message}`);
}
debug('Done with main');
