import * as R from 'ramda';
import * as Rx from 'rxjs';
import { scan, map, tap, throttleTime, catchError } from 'rxjs/operators';
import Table from 'cli-table';
import commander from 'commander';
import { Exchange, Network, Options, Order, AnyOrderMessage } from './types';
import { exchanges, createOrderbook, reduceOrderEvents } from './';
import { constructEnvironment } from '@melonproject/protocol';
import {
  PriceInterface,
  QuantityInterface,
  createToken,
  toFixed,
} from '@melonproject/token-math';

const debug = require('debug')('exchange-aggregator');

const style = {
  head: ['ID', 'Exchange', 'Price', 'Volume', 'Cummulative volume'],
  colWidths: [25, 15, 25, 25, 25],
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

const displayVolume = (quantity: QuantityInterface) => {
  const base = quantity.token.symbol;
  const volume = toFixed(quantity);
  return `${volume} ${base}`;
};

const exchangeOrderObservableCreators = {
  [Exchange.RADAR_RELAY]: (options: Options) => {
    return exchanges.radarrelay.watch(options);
  },
  [Exchange.KRAKEN]: (options: Options) => {
    return exchanges.kraken.watch(options);
  },
  [Exchange.KYBER_NETWORK]: (options: Options) => {
    return exchanges.kyber.watch(options);
  },
  [Exchange.ETHFINEX]: (options: Options) => {
    return exchanges.ethfinex.watch(options);
  },
  [Exchange.OASIS_DEX]: (options: Options) => {
    const endpoint = 'ws://localhost:8545';
    const environment = constructEnvironment({ endpoint });

    return exchanges.oasisdex.watch({
      ...options,
      environment,
    });
  },
};

const exchangeOrderFetcherCreators = {
  [Exchange.RADAR_RELAY]: (options: Options) => {
    return exchanges.radarrelay.fetch(options);
  },
  [Exchange.KRAKEN]: (options: Options) => {
    return exchanges.kraken.fetch(options);
  },
  [Exchange.KYBER_NETWORK]: (options: Options) => {
    return exchanges.kyber.fetch(options);
  },
  [Exchange.ETHFINEX]: (options: Options) => {
    return exchanges.ethfinex.fetch(options);
  },
  [Exchange.OASIS_DEX]: (options: Options) => {
    const endpoint = 'ws://localhost:8545';
    const environment = constructEnvironment({ endpoint });

    return exchanges.oasisdex.fetch({
      ...options,
      environment,
    });
  },
};

const createExchangeOrderObservables = (
  options: Options,
  exchanges: Exchange[],
): Rx.Observable<AnyOrderMessage>[] => {
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

  const orderbook$ = Rx.merge(...observables).pipe(
    scan(reduceOrderEvents, []),
    map(orders => createOrderbook(options, orders)),
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
          const volume = displayVolume(value.trade.base);
          const cummulative = displayVolume(value.cummulative);
          bids.push([value.id, value.exchange, price, volume, cummulative]);
        });

        const asks = new Table(style);
        orderbook.asks.forEach(value => {
          const price = displayPrice(value.trade);
          const volume = displayVolume(value.trade.base);
          const cummulative = displayVolume(value.cummulative);
          asks.push([value.id, value.exchange, price, volume, cummulative]);
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
    promises.map(promise =>
      promise.catch(error => {
        debug('Error: %s', error);
        return [];
      }),
    ),
  );

  const orders = [].concat(...results);
  const orderbook = createOrderbook(options, orders);

  const bids = new Table(style);
  orderbook.bids.forEach(value => {
    const price = displayPrice(value.trade);
    const volume = displayVolume(value.trade.base);
    const cummulative = displayVolume(value.cummulative);
    bids.push([value.id, value.exchange, price, volume, cummulative]);
  });

  const asks = new Table(style);
  orderbook.asks.forEach(value => {
    const price = displayPrice(value.trade);
    const volume = displayVolume(value.trade.base);
    const cummulative = displayVolume(value.cummulative);
    asks.push([value.id, value.exchange, price, volume, cummulative]);
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
  .option('-b, --base <symbol>', 'The base token symbol.')
  .option('-q, --quote <symbol>', 'The quote token symbol.')
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

    if (!options.base || !options.quote) {
      console.error('You need to specify a quote and base token.');
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
