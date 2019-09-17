import commander from 'commander';
import {
  // Public
  orderbook,
  time,
  instruments,
  fees,
  currencies,
  balances,
  // Private
  Authentication,
  getorders,
  // Websocket
  subscribe,
} from './api';
import { fetchOrderbook } from './abstract';
import { SubscriptionParams, OrderBookParams } from './api/types';
import * as Rx from 'rxjs';
// import { log } from './debug';
// import { observe } from './abstract';
// import * as readline from 'readline';

// tslint:disable-next-line:variable-name
const Table = require('cli-table');

interface OrderbookOptions {
  level: number;
}

// tslint:disable-next-line:no-default-export
export default (program: typeof commander, args: string[]) => {
  /* REST PUBLIC */
  program
    .command('orderbook <base> <quote>')
    .option('--level [level]', 'The level (format) of the orderbook.', '3')
    .action(async (base: string, quote: string, options: OrderbookOptions) => {
      const data = new Table({
        head: ['TYPE', 'VOLUME', 'PRICE', 'DATE'],
      });

      const params = {
        instrument_code: `${base}_${quote}`,
        level: options.level,
      } as OrderBookParams;

      const ob = await orderbook(params);

      ob.asks.forEach(value => {
        data.push(['ASK', value.amount, value.price, ob.time]);
      });

      data.push([]);

      ob.bids.forEach(value => {
        data.push(['BID', value.amount, value.price, ob.time]);
      });

      console.log(data.toString());
    });

  program.command('time').action(async () => {
    console.log(await time());
  });

  program.command('instruments').action(async () => {
    console.log(await instruments());
  });

  program.command('fees').action(async () => {
    console.log(JSON.stringify(await fees()));
  });

  program.command('currencies').action(async () => {
    console.log(await currencies());
  });

  /* REST PRIVATE */
  program.command('balances <apiKey>').action(async (apiKey: string) => {
    const api = ({
      apiKey: apiKey,
    } as any) as Authentication;

    console.log(JSON.stringify(await balances(api)));
  });

  program.command('getorders <apiKey>').action(async (apiKey: string) => {
    const api = ({
      apiKey: apiKey,
    } as any) as Authentication;

    console.log(JSON.stringify(await getorders(api)));
  });

  /* WEBSOCKET */
  program.command('ws').action(async (base: string, quote: string) => {
    const opts = {
      type: 'SUBSCRIBE',
      channels: [
        {
          name: 'ORDER_BOOK',
          instrument_codes: [`${base}_${quote}`],
        },
      ],
    } as SubscriptionParams;

    const operator = subscribe(opts);

    Rx.from(operator).subscribe({
      next: value => {
        console.log(value);
      },
      error: error => {
        console.error(error);
        process.exit(1);
      },
      complete: () => {
        process.exit(0);
      },
    });
  });

  /* ABSTRACT */
  program.command('fetch').action(async (base: string, quote: string) => {
    const opts = {
      base,
      quote,
    };

    // const operator = options.watch ? observe(opts) : fetch(opts);
    const operator = fetchOrderbook(opts);

    Rx.from(operator).subscribe({
      next: orderbook => {
        const data = new Table({
          head: ['TYPE', 'VOLUME', 'PRICE'],
        });

        orderbook.asks.forEach(entry => {
          data.push(['ASK', entry.volume.toFixed(8), entry.price.toFixed(8)]);
        });

        data.push([]);

        orderbook.bids.forEach(entry => {
          data.push(['BID', entry.volume.toFixed(8), entry.price.toFixed(8)]);
        });

        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        console.log(data.toString());
      },
      error: error => {
        console.error(error);
        process.exit(1);
      },
      complete: () => {
        process.exit(0);
      },
    });
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
