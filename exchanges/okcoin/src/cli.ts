import commander from 'commander';
// import * as Rx from 'rxjs';
// import * as readline from 'readline';

import { Authentication } from './api/types';

import {
  // account
  currencies,
  wallet,

  // spot
  instruments,
  accounts,
} from './api';

const passphrase = 'WoortonOKCOIN';
const key = '1922c28c-6e62-4fe5-9ef5-1b42c9c19c64';
const secret = '2861BFA141DE9C40FF763EC00C7CE106';

// tslint:disable-next-line:variable-name
// const Table = require('cli-table');

// tslint:disable-next-line:no-default-export
export default (program: typeof commander, args: string[]) => {
  program
    // .command('currencies <key> <secret> <passphrase>')
    // .action(async (key:string, secret: string, passphrase:string) => {
    .command('currencies')
    .action(async () => {
      const auth = {
        key: key,
        secret: secret,
        passphrase: passphrase,
      } as Authentication;

      console.log(await currencies(auth));
    });

  program
    // .command('currencies <key> <secret> <passphrase>')
    // .action(async (key:string, secret: string, passphrase:string) => {
    .command('wallet')
    .action(async () => {
      const auth = {
        key: key,
        secret: secret,
        passphrase: passphrase,
      } as Authentication;

      console.log(await wallet(auth));
    });

  /* SPOT */
  program
    // .command('currencies <key> <secret> <passphrase>')
    // .action(async (key:string, secret: string, passphrase:string) => {
    .command('instruments')
    .action(async () => {
      const auth = {
        key: key,
        secret: secret,
        passphrase: passphrase,
      } as Authentication;

      console.log(await instruments(auth));
    });

  program
    // .command('currencies <key> <secret> <passphrase>')
    // .action(async (key:string, secret: string, passphrase:string) => {
    .command('accounts')
    .action(async () => {
      const auth = {
        key: key,
        secret: secret,
        passphrase: passphrase,
      } as Authentication;

      console.log(await accounts(auth));
    });

  program.on('command:*', () => {
    program.help();
    process.exit(1);
  });

  program.parse(args);
  if (!program.args.length) {
    program.help();
    process.exit(1);
  }
};
