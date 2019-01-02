import * as R from 'ramda';
import * as Rx from 'rxjs';
import { tap } from 'rxjs/operators';
import commander from 'commander';
import { Exchange, Network, Options } from './types';
import {
  getObservableRadarRelayOrders,
  standardizeStream as standarizeRadarRelayStream,
} from './exchanges/radar-relay';
import {
  getObservableKrakenOrders,
  standardizeStream as standarizeKrakenStream,
} from './exchanges/kraken';
import {
  getObservableKyberOrders,
  standardizeStream as standarizeKyberStream,
} from './exchanges/kyber';
import { debugEvent } from './exchanges';

const debug = require('debug')('exchange-aggregator');

export const exchangeOrderObservableCreators = {
  [Exchange.RADAR_RELAY]: (options: Options) =>
    standarizeRadarRelayStream(getObservableRadarRelayOrders(options)),
  [Exchange.KRAKEN]: (options: Options) =>
    standarizeKrakenStream(getObservableKrakenOrders(options)),
  [Exchange.KYBER]: (options: Options) =>
    standarizeKyberStream(getObservableKyberOrders(options)),
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
    const opts = {
      base: options.base,
      quote: options.quote,
      network: (Network[options.network] as unknown) as Network,
    };

    debug('Aggregating orderbook for %s.', exchanges.join(', '));
    const observables = createExchangeOrderObservables(opts, exchanges);

    Rx.merge(...observables)
      .pipe(tap(value => debugEvent(value)))
      .subscribe();

    process.stdin.resume();
  });

commander.parse(process.argv);
