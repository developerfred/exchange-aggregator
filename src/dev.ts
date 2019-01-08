import * as R from 'ramda';
import * as Rx from 'rxjs';
import Table from 'cli-table';
import commander from 'commander';
import { Exchange, Network, Options } from './types';
import { observeRadarRelay } from './exchanges/radar-relay';
import { observeKraken } from './exchanges/kraken';
import { observeKyber } from './exchanges/kyber';
import { observeEthfinex } from './exchanges/ethfinex';
import { createToken } from '@melonproject/token-math/token';
// import { PriceIntTerface, toFixed } from '@melonproject/token-math/price';
import { scan, tap, throttleTime } from 'rxjs/operators';
import { aggregateOrderbook, initializeOrderbook } from './exchanges/aggregate';

const debug = require('debug')('exchange-aggregator');

// const displayPrice = (price: PriceInterface, decimals?: number) => {
//   const value = toFixed(price, decimals);
//   return `${value} ${price.quote.token.symbol}`;
// };

export const exchangeOrderObservableCreators = {
  [Exchange.RADAR_RELAY]: (options: Options) => observeRadarRelay(options),
  [Exchange.KRAKEN]: (options: Options) => observeKraken(options),
  [Exchange.KYBER]: (options: Options) => observeKyber(options),
  [Exchange.ETHFINEX]: (options: Options) => observeEthfinex(options),
};

export const createExchangeOrderObservable = R.curry(
  (options: Options, exchange: Exchange) => {
    return exchangeOrderObservableCreators[exchange](options);
  },
);

export const createExchangeOrderObservables = R.curry(
  (
    options: Options,
    exchanges: Exchange[] = [Exchange.RADAR_RELAY],
  ): Rx.Observable<any>[] => {
    return exchanges.map(createExchangeOrderObservable(options));
  },
);

commander.description('The exchange-aggregator testing tool.');

commander
  .command('orders [exchanges...]')
  .option(
    '-n, --network <network>',
    'The network (KOVAN/MAINNET).',
    /(MAINNET|KOVAN)/,
    'MAINNET',
  )
  .option('-b, --base <symbol>', 'The base token symbol.', /[A-Z]{3,4}/, 'ZRX')
  .option(
    '-q, --quote <symbol>',
    'The quote token symbol.',
    /[A-Z]{3,4}/,
    'ETH',
  )
  .description('Retrieve orders from the given exchanges')
  .action((args, options) => {
    const supported = Object.keys(Exchange);
    const invalid = R.difference(args, supported);

    if (invalid && invalid.length) {
      console.error(
        `Invalid exchanges %s. Supported exchanges are %s.`,
        invalid.join(', '),
        supported.join(', '),
      );

      process.exit(1);
    }

    const exchanges = args.length ? args : supported;
    const opts: Options = {
      network: (Network[options.network] as unknown) as Network,
      pair: {
        base: createToken(options.base),
        quote: createToken(options.quote),
      },
    };

    debug('Aggregating orderbook for %s.', exchanges.join(', '));
    const observables = createExchangeOrderObservables(opts, exchanges);
    Rx.merge(...observables)
      .pipe(
        scan(aggregateOrderbook, initializeOrderbook(opts)),
        tap(orderbook => {
          const bids = orderbook.bids.length;
          const asks = orderbook.asks.length;
          debug('Aggregated orderbook with %s bids and %s asks.', bids, asks);
        }),
        throttleTime(5000),
      )
      .subscribe(orderbook => {
        const style = {
          head: ['ID', 'Exchange', 'Price'],
          colWidths: [25, 15, 25],
          chars: {
            top: '═',
            'top-mid': '╤',
            'top-left': '╔',
            'top-right': '╗',
            bottom: '═',
            'bottom-mid': '╧',
            'bottom-left': '╚',
            'bottom-right': '╝',
            left: '║',
            'left-mid': '╟',
            mid: '─',
            'mid-mid': '┼',
            right: '║',
            'right-mid': '╢',
            middle: '│',
          },
        };

        const bids = new Table(style);
        orderbook.bids.forEach(value => {
          // const price = displayPrice(value.trade);
          const price = '???';

          bids.push([value.id, value.exchange, price]);
        });

        const asks = new Table(style);
        orderbook.asks.forEach(value => {
          // const price = displayPrice(value.trade);
          const price = '???';

          asks.push([value.id, value.exchange, price]);
        });

        console.log('Bids');
        console.log(bids.toString());

        console.log('Asks');
        console.log(asks.toString());
      });

    process.stdin.resume();
  });

commander.parse(process.argv);
