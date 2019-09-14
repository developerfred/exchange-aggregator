import * as Rx from 'rxjs';
import commander from 'commander';
import * as readline from 'readline';
import { observe, fetch } from './abstract/orderbook';

// tslint:disable-next-line:variable-name
const Table = require('cli-table');

interface OrderbookOptions {
  depth: string;
  watch: boolean;
}

// tslint:disable-next-line:no-default-export
export default (program: typeof commander, args: string[]) => {
  program
    .command('orderbook <base> <quote>')
    .option('--depth [depth]', 'The depth of the orderbook.', 10)
    .option('--watch', 'The depth of the orderbook.', false)
    .action(async (base: string, quote: string, options: OrderbookOptions) => {
      const opts = {
        base,
        quote,
        depth: options.depth as any,
      };

      const operator = options.watch ? observe(opts) : fetch(opts);

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
          process.exit(0);
        },
        complete: () => {
          process.exit(1);
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
