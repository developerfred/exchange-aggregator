import * as R from 'ramda';
import * as Rx from 'rxjs';
import axios from 'axios';
import {
  map,
  switchMap,
  delay,
  retryWhen,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import {
  Network,
  Options,
  NormalizedMessageType,
  Exchange,
  SnapshotMessage,
  Order,
  OrderType,
} from '../../types';
import { createPrice } from '@melonproject/token-math/price';
import { createQuantity } from '@melonproject/token-math/quantity';
import { debugEvent } from '../debug';

const debug = require('debug')('exchange-aggregator:kyber');

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

const getCurrenciesHttpUrl = (options: Options) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'https://api.kyber.network/currencies';
    default:
      throw new Error('Kyber only supports the MAINNET network.');
  }
};

const getRateHttpUrl = (
  options: Options,
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

  switch (options.network) {
    case Network.MAINNET:
      return `${prefix}?${suffix}`;
    default:
      throw new Error('Kyber only supports the MAINNET network.');
  }
};

export const observeKyber = (options: Options) => {
  if (options.pair.quote.symbol !== 'ETH') {
    throw new Error('Kyber only support ETH as a quote token.');
  }

  const currencies$ = Rx.defer(() => {
    const url = getCurrenciesHttpUrl(options);
    const request = axios.get(url).then(result => result.data);
    return Rx.from(request as Promise<KyberCurrenciesResponse>);
  }).pipe(map(result => result.data));

  const formatResponse = (type: OrderType, response: KyberRateResponse) => {
    if (response.error) {
      throw new Error(`Error trying to fetch Kyber ${type} rates.`);
    }

    const volumeKey = type === OrderType.ASK ? 'dst_qty' : 'src_qty';
    const priceKey = type === OrderType.ASK ? 'src_qty' : 'dst_qty';
    const groups = response.data.map(current => {
      return Object.keys(current[volumeKey] as any).map(index => {
        // TODO: Is this correct?
        const price = createPrice(
          createQuantity(options.pair.base, current[priceKey][index]),
          createQuantity(options.pair.quote, current[volumeKey][index]),
        );

        return {
          type,
          exchange: Exchange.KYBER,
          trade: price,
        };
      });
    });

    return [].concat(...groups) as Order[];
  };

  const pollRate = (currencies: Currency[]) => {
    const base = options.pair.base.symbol;
    const quote = options.pair.quote.symbol;
    const currency = currencies.find(R.propEq('symbol', base));
    if (!currency) {
      throw new Error(`The ${base} token is not supported.`);
    }

    // TODO: Pass the interval through configuration.
    const interval = [1, 10, 20, 30, 40, 50, 75, 100, 125, 150];
    return Rx.interval(5000).pipe(
      tap(() => {
        debug(`Loading snapshot for market %s-%s.`, base, quote);
      }),
      switchMap(() => {
        const buyUrl = getRateHttpUrl(options, 'buy', currency.id, interval);
        const sellUrl = getRateHttpUrl(options, 'sell', currency.id, interval);
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
        ([buyResponse, sellResponse]): Order[] =>
          [].concat(
            formatResponse(OrderType.BID, buyResponse),
            formatResponse(OrderType.ASK, sellResponse),
          ),
      ),
      retryWhen(error => error.pipe(delay(10000))),
    );
  };

  const rates$ = currencies$.pipe(switchMap(pollRate));
  return rates$.pipe(
    map(
      (orders): SnapshotMessage => ({
        event: NormalizedMessageType.SNAPSHOT,
        exchange: Exchange.KYBER,
        orders,
      }),
    ),
    tap(value => {
      debug(...debugEvent(value));
    }),
  );
};
