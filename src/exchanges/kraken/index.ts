import * as Rx from 'rxjs';
import axios from 'axios';
import {
  map,
  tap,
  switchMap,
  share,
  delay,
  retryWhen,
  distinctUntilChanged,
} from 'rxjs/operators';
import {
  Network,
  Options,
  Order,
  StandardizedMessageType,
  Exchange,
} from '../../types';

const debug = require('debug')('exchange-aggregator:kraken');

const getHttpUrl = (base: string, quote: string, network: Network) => {
  switch (network) {
    case Network.MAINNET:
      return `https://api.kraken.com/0/public/Depth?pair=${base}${quote}`;
    default:
      throw new Error('Kraken only supports the MAINNET network.');
  }
};

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

export const getObservableKrakenOrders = ({
  base,
  quote,
  network,
}: Options) => {
  const polling$ = Rx.interval(5000).pipe(
    switchMap(() => {
      debug(`Loading snapshot for market ${base}-${quote}.`);
      const url = getHttpUrl(base, quote, network);
      return Rx.from(axios.get(url).then(result => result.data) as Promise<
        KrakenResponse
      >);
    }),
    map(data => {
      if (data.error && data.error.length) {
        throw new Error('Error while trying to fetch the snapshot.');
      }

      const orderbook = (data.result && data.result[`X${base}X${quote}`]) || {
        asks: [],
        bids: [],
      };

      return {
        ...orderbook,
        base,
        quote,
      } as KrakenOrderbook;
    }),
    tap(orderbook => {
      debug(
        'Loaded orderbook with %s bids and %s asks.',
        orderbook.bids.length,
        orderbook.asks.length,
      );
    }),
    retryWhen(error => {
      debug('Kraken failed with error.');
      return error.pipe(delay(10000));
    }),
    distinctUntilChanged(),
  );

  return polling$.pipe(share());
};

const standardizeOrder = (order: any): Order => ({
  price: parseFloat(order[0]),
  volume: parseFloat(order[1]),
});

export const standardizeStream = (
  stream$: ReturnType<typeof getObservableKrakenOrders>,
) => {
  return stream$.pipe(
    map(orderbook => {
      const asks = orderbook.asks.map(order => standardizeOrder(order));

      const bids = orderbook.bids.map(order => standardizeOrder(order));

      return {
        event: StandardizedMessageType.SNAPSHOT,
        exchange: Exchange.KRAKEN,
        base: orderbook.base,
        quote: orderbook.quote,
        asks,
        bids,
      };
    }),
  );
};
