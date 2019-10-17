import * as Rx from 'rxjs';
import commander from 'commander';
import * as readline from 'readline';
import { fetch } from './abstract/orderbook';
import { Eth } from 'web3-eth';
import { Token } from '@melonproject/ea-common';
import { Environment } from '.';
import mainnet from './deployments/mainnet';

// tslint:disable-next-line:variable-name
const Table = require('cli-table');

interface OrderbookOptions {
  endpoint: string;
}

const weth: Token = {
  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  decimals: 18,
  symbol: 'WETH',
};

const dgx: Token = {
  address: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
  decimals: 9,
  symbol: 'DGX',
};

// tslint:disable-next-line:no-default-export
export default (program: typeof commander, args: string[]) => {
  const orderbook = program
    // .command('orderbook <base> <quote>')
    .command('orderbook')
    .option('--endpoint <endpoint>', 'http://localhost:8545')
    .action(async () => {
      const options = (orderbook as any) as OrderbookOptions;
      const env: Environment = {
        client: new Eth(options.endpoint),
        deployment: mainnet,
      };

      // TODO: Dynamic tokens.
      const opts = {
        base: weth,
        quote: dgx,
        environment: env,
      };

      Rx.from(fetch(opts)).subscribe({
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
