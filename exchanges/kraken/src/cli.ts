import commander from 'commander';
import { depth } from './api';

// tslint:disable-next-line:variable-name
const Table = require('cli-table');

interface OrderbookOptions {
  depth: string;
}

// tslint:disable-next-line:no-default-export
export default (program: typeof commander, args: string[]) => {
  program
    .command('orderbook <base> <quote>')
    .option('--depth [depth]', 'The depth of the orderbook.', 10)
    .action(async (base: string, quote: string, options: OrderbookOptions) => {
      const data = new Table({
        head: ['TYPE', 'VOLUME', 'PRICE', 'DATE'],
      });

      const { asks, bids } = (Object.values(
        await depth({
          pair: `${base}${quote}`,
          count: parseInt(options.depth, 10),
        }),
      )[0] as any) as {
        asks: [string, string, number][];
        bids: [string, string, number][];
      };

      asks.forEach(([price, volume, timestamp]) => {
        data.push(['ASK', volume, price, timestamp]);
      });

      data.push([]);

      bids.forEach(([price, volume, timestamp]) => {
        data.push(['BID', volume, price, timestamp]);
      });

      console.log(data.toString());
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
