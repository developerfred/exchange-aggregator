import * as R from 'ramda';
import * as Rx from 'rxjs';
import axios from 'axios';
import {
  map,
  switchMap,
  delay,
  retryWhen,
  distinctUntilChanged,
} from 'rxjs/operators';
import {
  Network,
  Options,
  StandardizedMessageType,
  Exchange,
  SnapshotMessage,
  Order,
} from '../../types';

const debug = require('debug')('exchange-aggregator:kyber');

const getCurrenciesHttpUrl = (network: Network) => {
  switch (network) {
    case Network.MAINNET:
      return 'https://api.kyber.network/currencies';
    default:
      throw new Error('Kyber only supports the MAINNET network.');
  }
};

const getRateHttpUrl = (
  network: Network,
  type: 'buy' | 'sell',
  currency: string,
  interval: number[],
) => {
  const prefix = `https://api.kyber.network/${type}_rate`;
  const splits = R.splitEvery(5, interval);
  const suffix = splits
    .map(split => {
      const quantities = split
        .map(qty => {
          return `qty=${qty}`;
        })
        .join('&');

      return `id=${currency}&${quantities}`;
    })
    .join('&');

  switch (network) {
    case Network.MAINNET:
      return `${prefix}?${suffix}`;
    default:
      throw new Error('Kyber only supports the MAINNET network.');
  }
};

interface Currency {
  name: string;
  decimals: number;
  address: string;
  symbol: string;
  id: string;
}

interface KyberCurrenciesResponse {
  error: any;
  data: Currency[];
}

interface KyberOrderbook {
  base: string;
  quote: string;
  asks: Order[];
  bids: Order[];
}

interface Rate {
  src_id: string;
  dst_id: string;
  src_qty: number[];
  dst_qty: [];
}

interface KyberRateResponse {
  error: any;
  data: Rate[];
}

export const getObservableKyberOrders = ({ base, quote, network }: Options) => {
  if (quote !== 'ETH') {
    throw new Error('Kyber only support ETH as a quote token.');
  }

  const currencies$ = Rx.defer(() => {
    const url = getCurrenciesHttpUrl(network);
    return Rx.from(axios.get(url).then(result => result.data) as Promise<
      KyberCurrenciesResponse
    >);
  }).pipe(map(result => result.data));

  const formatResponse = (
    type: 'buy' | 'sell',
    response: KyberRateResponse,
  ) => {
    if (response.error) {
      throw new Error(`Error trying to fetch Kyber ${type} rates.`);
    }

    const volumeKey = type === 'buy' ? 'dst_qty' : 'src_qty';
    const priceKey = type === 'buy' ? 'src_qty' : 'dst_qty';
    const groups = response.data.map(current => {
      return (current[volumeKey] as any).map(
        (volume, index) =>
          ({
            volume,
            price: current[priceKey][index],
          } as Order),
      );
    });

    return [].concat(...groups) as Order[];
  };

  const pollRate = (currencies: Currency[]) => {
    const currency = currencies.find(R.propEq('symbol', base));
    if (!currency) {
      throw new Error(`The ${base} token is not supported.`);
    }

    const interval = [1, 10, 20, 30, 40, 50, 75, 100, 125, 150];
    return Rx.interval(5000).pipe(
      switchMap(() => {
        debug(`Loading snapshots for market %s-%s.`, base, quote);

        const buyUrl = getRateHttpUrl(network, 'buy', currency.id, interval);
        const sellUrl = getRateHttpUrl(network, 'sell', currency.id, interval);
        const sellRequest = axios
          .get(sellUrl)
          .then(result => result.data) as Promise<KyberRateResponse>;
        const buyRequest = axios
          .get(buyUrl)
          .then(result => result.data) as Promise<KyberRateResponse>;

        return Rx.from(Promise.all([buyRequest, sellRequest]));
      }),
      distinctUntilChanged(),
      map(
        ([buyResponse, sellResponse]) =>
          ({
            base,
            quote,
            asks: formatResponse('buy', buyResponse),
            bids: formatResponse('sell', sellResponse),
          } as KyberOrderbook),
      ),
      retryWhen(error => {
        debug('Kyber failed with error.');
        return error.pipe(delay(10000));
      }),
    );
  };

  const rates$ = currencies$.pipe(switchMap(pollRate));

  return rates$;
};

export const standardizeStream = (
  stream$: ReturnType<typeof getObservableKyberOrders>,
) => {
  return stream$.pipe(
    map(
      orderbook =>
        ({
          event: StandardizedMessageType.SNAPSHOT,
          exchange: Exchange.KYBER,
          base: orderbook.base,
          quote: orderbook.quote,
          asks: orderbook.asks,
          bids: orderbook.bids,
        } as SnapshotMessage),
    ),
  );
};
