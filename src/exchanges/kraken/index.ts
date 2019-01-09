import * as Rx from 'rxjs';
import * as R from 'ramda';
import axios from 'axios';
import {
  map,
  switchMap,
  share,
  delay,
  retryWhen,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import {
  Network,
  Order,
  NormalizedMessageType,
  Exchange,
  OrderType,
  SnapshotMessage,
  Options,
} from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';
import { debugEvent } from '../debug';

const debug = require('debug')('exchange-aggregator:kraken');

const getHttpUrl = (options: Options) => {
  const base = options.pair.base.symbol;
  const quote = options.pair.quote.symbol;

  switch (options.network) {
    case Network.MAINNET:
      return `https://api.kraken.com/0/public/Depth?pair=${base}${quote}`;
    default:
      throw new Error('Kraken only supports the MAINNET network.');
  }
};

const normalizeOrder = R.curryN(
  3,
  (
    options: Options,
    type: OrderType,
    [price, volume, timestamp]: [number, number, number],
  ): Order => {
    const oid = Buffer.from(
      `${Exchange.KRAKEN}:${price}:${volume}:${timestamp}`,
    ).toString('base64');
    const trade = createPrice(
      createQuantity(options.pair.base, volume),
      createQuantity(options.pair.quote, price * volume),
    );

    return {
      id: oid,
      type,
      exchange: Exchange.KRAKEN,
      trade,
    };
  },
);

interface KrakenOrderbook {
  base: string;
  quote: string;
  asks: [number, number, number][];
  bids: [number, number, number][];
}

interface KrakenResponse {
  error: string[];
  result?: {
    [key: string]: KrakenOrderbook;
  };
}

export const observeKraken = (options: Options) => {
  try {
    const url = getHttpUrl(options);
    const polling$ = Rx.interval(5000).pipe(
      switchMap(async () => {
        const response = await axios
          .get(url)
          .then(value => value.data as KrakenResponse);

        if (response.error && response.error.length) {
          throw new Error(response.error.join(''));
        }

        return response.result;
      }),
      retryWhen(error =>
        error.pipe(
          tap(error => debug(error)),
          delay(10000),
        ),
      ),
      map(
        (result): Order[] => {
          const key = `X${options.pair.base.symbol}X${
            options.pair.quote.symbol
          }`;
          const orderbook: any = (result && result[key]) || {
            asks: [],
            bids: [],
          };

          return [].concat(
            orderbook.asks.map(normalizeOrder(options, OrderType.ASK)),
            orderbook.bids.map(normalizeOrder(options, OrderType.BID)),
          );
        },
      ),
      distinctUntilChanged(),
    );

    const orders$ = polling$.pipe(share());
    return orders$.pipe(
      map(
        (orders: Order[]): SnapshotMessage => ({
          event: NormalizedMessageType.SNAPSHOT,
          exchange: Exchange.KRAKEN,
          orders,
        }),
      ),
      tap(value => {
        debug(...debugEvent(value));
      }),
    );
  } catch (error) {
    return Rx.throwError(error);
  }
};
