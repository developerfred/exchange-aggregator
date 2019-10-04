import commander from 'commander';
// import * as Rx from 'rxjs';
// import * as readline from 'readline';

import {
  Authentication,

  /* SPOT */
  PlaceLimitOrderParams,
  OpenOrdersParams,
} from './api/types';

import {
  /* ACCOUNT */
  currencies,
  wallet,
  // transfer,
  // withdrawal,
  withdrawalfee,
  withdrawalhistory,
  ledgerAccount,
  depositaddress,
  deposithistory,

  /* SPOT */
  instruments,
  accounts,
  currency,
  // ledgerSpot
  placeorder,
  cancelorders,
  // orderslist
  openorders,
} from './api';

// tslint:disable-next-line:variable-name
// const Table = require('cli-table');

// tslint:disable-next-line:no-default-export
export default (program: typeof commander, args: string[]) => {
  /* ACCOUNT */
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

  program.command('wallet').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await wallet(auth));
  });

  program.command('withdrawalfee').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await withdrawalfee(auth));
  });

  program.command('withdrawalhistory').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await withdrawalhistory(auth));
  });

  program.command('ledgerAccount').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await ledgerAccount(auth));
  });

  program.command('depositaddress <currency>').action(async (currency: string) => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await depositaddress(auth, currency));
  });

  program.command('deposithistory').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await deposithistory(auth));
  });

  /* SPOT */
  program.command('instruments').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await instruments(auth));
  });

  program.command('accounts').action(async () => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await accounts(auth));
  });

  program.command('currency <currency>').action(async (currency_token: string) => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    console.log(await currency(auth, currency_token));
  });

  // program
  // .command('ledgerSpot')
  // .action(async () => {
  //   const auth = {
  //     key: key,
  //     secret: secret,
  //     passphrase: passphrase,
  //   } as Authentication;

  //   console.log(await ledgerSpot(auth));
  // });

  program
    .command('postlimitorder <side> <size> <pair> <price>')
    .action(async (side: string, size: string, instrument_id: string, price: string) => {
      const auth = {
        key: key,
        secret: secret,
        passphrase: passphrase,
      } as Authentication;

      const data = {
        side: side,
        instrument_id: instrument_id,
        margin_trading: 1,
        type: 'limit',
        price: price,
        size: size,
      } as PlaceLimitOrderParams;

      console.log(await placeorder(auth, data));
    });

  program
    .command('cancelorders <side> <size> <pair> <price>')
    .action(async (side: string, size: string, instrument_id: string, price: string) => {
      const auth = {
        key: key,
        secret: secret,
        passphrase: passphrase,
      } as Authentication;

      const data = {
        side: side,
        instrument_id: instrument_id,
        margin_trading: 1,
        type: 'limit',
        price: price,
        size: size,
      } as PlaceLimitOrderParams;

      const order = await placeorder(auth, data);

      console.log(await cancelorders(auth, order.order_id, instrument_id));
    });

  program.command('openorders <currency>').action(async (currency_token: string) => {
    const auth = {
      key: key,
      secret: secret,
      passphrase: passphrase,
    } as Authentication;

    const params = {
      instrument_id: currency_token,
    } as OpenOrdersParams;

    console.log(await openorders(auth, params));
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
