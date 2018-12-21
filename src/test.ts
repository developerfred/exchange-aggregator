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
  .description('Retrieve orders from the given exchanges')
  .option('-n, --network <network>', 'The network (KOVAN/MAINNET).', 'MAINNET')
  .option('-b, --base <symbol>', 'The base token symbol.', 'ZRX')
  .option('-q, --quote <symbol>', 'The quote token symbol.', 'ETH')
  .action(async (args, options) => {
    const allowed = Object.keys(Exchange);
    const invalid = R.difference(args, allowed);

    if (invalid && invalid.length) {
      console.error(
        `Invalid exchanges ${invalid.join(
          ', ',
        )}. Supported exchanges are ${allowed.join(', ')}.`,
      );
      process.exit(1);
    }

    const exchanges = args.length ? args : allowed;
    debug('Aggregating orderbook for %s.', exchanges.join(', '));

    const observables = createExchangeOrderObservables(
      {
        base: options.base,
        quote: options.quote,
        network: (Network[options.network] as unknown) as Network,
      },
      exchanges,
    );

    Rx.merge(...observables)
      .pipe(tap(value => debugEvent(value)))
      .subscribe(
        message => {
          // Nothing to do here.
        },
        error => {
          console.error(error);
          process.exit(1);
        },
      );

    process.stdin.resume();
  });

commander.parse(process.argv);
