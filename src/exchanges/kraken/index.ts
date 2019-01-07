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
import { debugEvent } from '..';

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
  (options: Options, type: OrderType, order: any): Order => {
    // TODO: Figure out the right formula here.
    const price = createPrice(
      createQuantity(options.pair.base, parseFloat(order[0])),
      createQuantity(options.pair.quote, parseFloat(order[1])),
    );

    return {
      type,
      exchange: Exchange.KRAKEN,
      trade: price,
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
  const polling$ = Rx.interval(5000).pipe(
    switchMap(() => {
      const url = getHttpUrl(options);
      return Rx.from(axios.get(url).then(result => result.data) as Promise<
        KrakenResponse
      >);
    }),
    map(
      (data): Order[] => {
        if (data.error && data.error.length) {
          throw new Error('Error while trying to fetch the snapshot.');
        }

        const key = `X${options.pair.base.symbol}X${options.pair.quote.symbol}`;
        const orderbook = (data.result && data.result[key]) || {
          asks: [],
          bids: [],
        };

        return [].concat(
          normalizeOrder(OrderType.ASK, orderbook.asks),
          normalizeOrder(OrderType.BID, orderbook.bids),
        );
      },
    ),
    retryWhen(error => error.pipe(delay(10000))),
    distinctUntilChanged(),
  );

  const orders$ = polling$.pipe(share());
  return orders$.pipe(
    map(
      (orders): SnapshotMessage => ({
        event: NormalizedMessageType.SNAPSHOT,
        exchange: Exchange.KRAKEN,
        orders,
      }),
    ),
    tap(value => {
      debug(...debugEvent(value));
    }),
  );
};
