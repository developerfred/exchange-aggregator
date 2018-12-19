import * as R from 'ramda';
import * as Rx from 'rxjs';
import { tap, scan } from 'rxjs/operators';
import commander from 'commander';
import { Exchange, Network, Options } from './types';
import {
  getObservableRadarRelayOrders,
  standardizeStream,
} from './exchanges/radar-relay';
import { debugEvent, scanEvent } from './exchanges';

const debug = require('debug')('exchange-aggregator');

export const exchangeOrderObservableCreators = {
  [Exchange.RADAR_RELAY]: (options: Options) =>
    standardizeStream(getObservableRadarRelayOrders(options)),
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
  .option('-q, --quote <symbol>', 'The quote token symbol.', 'WETH')
  .action(async (args, options) => {
    const allowed = ['radar-relay'];
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
        network: Network.MAINNET,
      },
      [Exchange.RADAR_RELAY],
    );

    Rx.merge(...observables)
      .pipe(
        tap(value => debugEvent(value)),
        scan(scanEvent, {}),
        tap(value =>
          debug(`Orderbook contains %s orders.`, Object.keys(value).length),
        ),
      )
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
