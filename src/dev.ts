import * as R from 'ramda';
import * as Rx from 'rxjs';
import { scan, map, tap, catchError } from 'rxjs/operators';
import Table from 'cli-table';
import commander from 'commander';
import { Exchange, Network, Options, Order, AnyOrderMessage } from './types';
import { exchanges, createOrderbook, reduceOrderEvents } from './';
import { constructEnvironment, getTokenBySymbol } from '@melonproject/protocol';
import { withDeployment } from '@melonproject/protocol/lib/utils/environment/withDeployment';
import { Tracks } from '@melonproject/protocol/lib/utils/environment/Environment';
import {
  PriceInterface,
  QuantityInterface,
  toFixed,
} from '@melonproject/token-math';
import { OasisDex } from './exchanges/oasisdex/types';
import { Kyber } from './exchanges/kyber/types';
import { Kraken } from './exchanges/kraken/types';
import { Ethfinex } from './exchanges/ethfinex/types';
import { RadarRelay } from './exchanges/radarrelay/types';

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
  [Exchange.RADAR_RELAY]: async (options: Options) => {
    return exchanges.radarrelay.watch(options as RadarRelay.WatchOptions);
  },
  [Exchange.KRAKEN]: async (options: Options) => {
    return exchanges.kraken.watch(options as Kraken.WatchOptions);
  },
  [Exchange.KYBER_NETWORK]: async (options: Options) => {
    return exchanges.kyber.watch(options as Kyber.WatchOptions);
  },
  [Exchange.ETHFINEX]: async (options: Options) => {
    return exchanges.ethfinex.watch(options as Ethfinex.WatchOptions);
  },
  [Exchange.OASIS_DEX]: async (options: Options) => {
    return exchanges.oasisdex.watch(options as OasisDex.WatchOptions);
  },
};

const exchangeOrderFetcherCreators = {
  [Exchange.RADAR_RELAY]: async (options: Options) => {
    return exchanges.radarrelay.fetch(options as RadarRelay.FetchOptions);
  },
  [Exchange.KRAKEN]: async (options: Options) => {
    return exchanges.kraken.fetch(options as Kraken.FetchOptions);
  },
  [Exchange.KYBER_NETWORK]: async (options: Options) => {
    return exchanges.kyber.fetch(options as Kyber.FetchOptions);
  },
  [Exchange.ETHFINEX]: async (options: Options) => {
    return exchanges.ethfinex.fetch(options as Ethfinex.FetchOptions);
  },
  [Exchange.OASIS_DEX]: async (options: Options) => {
    return exchanges.oasisdex.fetch(options as OasisDex.FetchOptions);
  },
};

const createExchangeOrderObservables = (
  options: Options,
  exchanges: Exchange[],
): Promise<Rx.Observable<AnyOrderMessage>[]> => {
  return Promise.all(
    exchanges.map(exchange => {
      return exchangeOrderObservableCreators[exchange](options);
    }),
  );
};

const createExchangeOrderFetchers = (
  options: Options,
  exchanges: Exchange[],
): Promise<Order[]>[] => {
  return exchanges.map(exchange => {
    return exchangeOrderFetcherCreators[exchange](options);
  });
};

const watch = async (options: Options, exchanges: Exchange[]) => {
  debug('Aggregating orderbook for %s.', exchanges.join(', '));
  const observables = (await createExchangeOrderObservables(
    options,
    exchanges,
  )).map(observable$ => observable$.pipe(catchError(() => Rx.empty())));

  const orderbook$ = Rx.merge(...observables).pipe(
    scan(reduceOrderEvents, []),
    map(orders => createOrderbook(options, orders)),
    tap(orderbook => {
      const bids = orderbook.bids.length;
      const asks = orderbook.asks.length;
      debug('Aggregated orderbook with %s bids and %s asks.', bids, asks);
    }),
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

    const prefix = (options.network as string).toLowerCase();
    const endpoint = `wss://${prefix}.infura.io/ws/v3/a0dcc5ab3b1a4bd49990810564edba93`;
    const environment = await withDeployment(
      constructEnvironment({
        track: Tracks.KYBER_PRICE,
        endpoint,
      }),
    );

    const base = getTokenBySymbol(environment, options.base);
    const quote = getTokenBySymbol(environment, options.quote);
    const pair = { base, quote };

    const exchanges = args.length ? args : supported;
    const opts: Options = {
      network: (Network[options.network] as unknown) as Network,
      environment,
      pair,
    };

    if (!!options.watch) {
      return watch(opts, exchanges);
    }

    return fetch(opts, exchanges);
  });

commander.parse(process.argv);
