import * as R from 'ramda';
import * as Rx from 'rxjs';
import Table from 'cli-table';
import commander from 'commander';
import {
  Exchange,
  Network,
  Options,
  Order,
  SnapshotMessage,
  OrderMessage,
} from './types';
import { observeRadarRelay } from './exchanges/radar-relay';
import { observeKraken } from './exchanges/kraken';
import { observeKyber } from './exchanges/kyber';
import { observeEthfinex, fetchEtfinexOrders } from './exchanges/ethfinex';
import { fetchOasisDexOrders } from './exchanges/oasis-dex';
import { constructEnvironment } from '@melonproject/protocol';
import { createToken } from '@melonproject/token-math/token';
import { PriceInterface, toFixed } from '@melonproject/token-math/price';
import { toFixed as toFixedQuantity } from '@melonproject/token-math/quantity';
import { scan, tap, throttleTime, catchError } from 'rxjs/operators';
import {
  initializeOrderbook,
  aggregateOrderbookFromEvents,
  aggregateOrderbookFromOrders,
} from './exchanges/aggregate';

const debug = require('debug')('exchange-aggregator');

const style = {
  head: ['ID', 'Exchange', 'Price', 'Volume'],
  colWidths: [25, 15, 25, 25],
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

const displayPrice = (price: PriceInterface, decimals?: number) => {
  const value = toFixed(price, decimals);
  const base = price.base.token.symbol;
  const quote = price.quote.token.symbol;
  return `${value} ${base}/${quote}`;
};

const displayVolume = (price: PriceInterface) => {
  const base = price.base.token.symbol;
  const quantity = toFixedQuantity(price.base);
  return `${quantity} ${base}`;
};

const exchangeOrderObservableCreators = {
  [Exchange.RADAR_RELAY]: (options: Options) => observeRadarRelay(options),
  [Exchange.KRAKEN]: (options: Options) => observeKraken(options),
  [Exchange.KYBER_NETWORK]: (options: Options) => observeKyber(options),
  [Exchange.ETHFINEX]: (options: Options) => {
    return observeEthfinex(options);
  },
  [Exchange.OASIS_DEX]: () =>
    Rx.throwError(new Error('OasisDex is not fully implemented yet.')),
};

const exchangeOrderFetcherCreators = {
  [Exchange.RADAR_RELAY]: () =>
    Promise.reject(new Error('Radar relay is not fully implemented yet')),
  [Exchange.KRAKEN]: (options: Options) =>
    Promise.reject(new Error('Kraken is not fully implemented yet')),
  [Exchange.KYBER_NETWORK]: (options: Options) =>
    Promise.reject(new Error('Kyber is not fully implemented yet')),
  [Exchange.ETHFINEX]: (options: Options) => {
    return fetchEtfinexOrders(options);
  },
  [Exchange.OASIS_DEX]: (options: Options) => {
    const endpoint = 'ws://localhost:8545';
    const environment = constructEnvironment({ endpoint });

    return fetchOasisDexOrders({
      ...options,
      environment,
    });
  },
};

const createExchangeOrderObservables = (
  options: Options,
  exchanges: Exchange[],
): Rx.Observable<SnapshotMessage | OrderMessage>[] => {
  return exchanges.map(exchange => {
    return exchangeOrderObservableCreators[exchange](options);
  });
};

const createExchangeOrderFetchers = (
  options: Options,
  exchanges: Exchange[],
): Promise<Order[]>[] => {
  return exchanges.map(exchange => {
    return exchangeOrderFetcherCreators[exchange](options);
  });
};

const watch = (options: Options, exchanges: Exchange[]) => {
  debug('Aggregating orderbook for %s.', exchanges.join(', '));
  const observables = createExchangeOrderObservables(options, exchanges).map(
    observable$ => observable$.pipe(catchError(() => Rx.empty())),
  );

  const initial = initializeOrderbook(options);
  const orderbook$ = Rx.merge(...observables).pipe(
    scan(aggregateOrderbookFromEvents, initial),
    tap(orderbook => {
      const bids = orderbook.bids.length;
      const asks = orderbook.asks.length;
      debug('Aggregated orderbook with %s bids and %s asks.', bids, asks);
    }),
    throttleTime(5000),
  );

  return new Promise((reject, resolve) => {
    orderbook$.subscribe(
      orderbook => {
        const bids = new Table(style);
        orderbook.bids.forEach(value => {
          const price = displayPrice(value.trade);
          const volume = displayVolume(value.trade);
          bids.push([value.id, value.exchange, price, volume]);
        });

        const asks = new Table(style);
        orderbook.asks.forEach(value => {
          const price = displayPrice(value.trade);
          const volume = displayVolume(value.trade);
          asks.push([value.id, value.exchange, price, volume]);
        });

        console.log('Asks');
        console.log(asks.toString());

        console.log('Bids');
        console.log(bids.toString());
      },
      error => {
        reject(error);
      },
      () => {
        resolve();
      },
    );
  });
};

const fetch = async (options: Options, exchanges: Exchange[]) => {
  const promises = createExchangeOrderFetchers(options, exchanges);
  const results = await Promise.all(
    promises.map(promise => {
      return promise.catch(() => []);
    }),
  );

  const initial = initializeOrderbook(options);
  const orderbook = results.reduce(aggregateOrderbookFromOrders, initial);

  const bids = new Table(style);
  orderbook.bids.forEach(value => {
    const price = displayPrice(value.trade);
    const volume = displayVolume(value.trade);
    bids.push([value.id, value.exchange, price, volume]);
  });

  const asks = new Table(style);
  orderbook.asks.forEach(value => {
    const price = displayPrice(value.trade);
    const volume = displayVolume(value.trade);
    asks.push([value.id, value.exchange, price, volume]);
  });

  console.log('Asks');
  console.log(asks.toString());

  console.log('Bids');
  console.log(bids.toString());
};

commander.description('The exchange-aggregator testing tool.');

commander
  .command('orders [exchanges...]')
  .option('-w, --watch', 'Wether or not to subscribe to updates automatically.')
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
  .action(async (args, options) => {
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

    if (!!options.watch) {
      return watch(opts, exchanges);
    }

    return fetch(opts, exchanges);
  });

commander.parse(process.argv);
