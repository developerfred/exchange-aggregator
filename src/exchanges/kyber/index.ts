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
  if (options.network !== Network.MAINNET) {
    throw new Error('Kyber only supports the MAINNET network.');
  }

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

  return `${prefix}?${suffix}`;
};

const formatResponse = (
  options: Options,
  type: OrderType,
  response: KyberRateResponse,
) => {
  if (response.error) {
    throw new Error(`Error trying to fetch Kyber ${type} rates.`);
  }

  const volumeKey = type === OrderType.ASK ? 'src_qty' : 'dst_qty';
  const priceKey = type === OrderType.ASK ? 'dst_qty' : 'src_qty';
  const groups = response.data.map(current => {
    return Object.keys(current[volumeKey] as any).map(index => {
      const volume = current[volumeKey][index];
      const price = current[priceKey][index];
      const oid = Buffer.from(`${Exchange.KYBER_NETWORK}:${volume}`).toString(
        'base64',
      );
      const trade = createPrice(
        createQuantity(options.pair.base, volume),
        createQuantity(options.pair.quote, price),
      );

      return {
        id: oid,
        type,
        exchange: Exchange.KYBER_NETWORK,
        trade,
      };
    });
  });

  return [].concat(...groups) as Order[];
};

const pollRate = R.curryN(2, (options: Options, currencies: Currency[]) => {
  try {
    const base = options.pair.base.symbol;
    const quote = options.pair.quote.symbol;
    const currency = currencies.find(R.propEq('symbol', base));
    if (!currency) {
      throw new Error(`The ${base} token is not supported.`);
    }

    // TODO: Pass the interval through configuration.
    const interval = [1, 10, 100, 1000];
    const buyUrl = getRateHttpUrl(options, 'buy', currency.id, interval);
    const sellUrl = getRateHttpUrl(options, 'sell', currency.id, interval);

    return Rx.interval(5000).pipe(
      tap(() => {
        debug(`Loading snapshot for market %s-%s.`, base, quote);
      }),
      switchMap(async () => {
        const sellRequest = axios
          .get(sellUrl)
          .then(result => result.data) as Promise<KyberRateResponse>;
        const buyRequest = axios
          .get(buyUrl)
          .then(result => result.data) as Promise<KyberRateResponse>;

        const [buyResponse, sellResponse] = await Promise.all([
          buyRequest,
          sellRequest,
        ]);

        return [buyResponse, sellResponse];
      }),
      retryWhen(error =>
        error.pipe(
          tap(error => debug(error)),
          delay(10000),
        ),
      ),
      distinctUntilChanged(),
      map(
        ([buyResponse, sellResponse]): Order[] =>
          [].concat(
            formatResponse(options, OrderType.BID, buyResponse),
            formatResponse(options, OrderType.ASK, sellResponse),
          ),
      ),
    );
  } catch (error) {
    return Rx.throwError(error);
  }
});

export const observeKyber = (options: Options) => {
  try {
    if (options.pair.quote.symbol !== 'ETH') {
      throw new Error('Kyber only support ETH as a quote token.');
    }

    const url = getCurrenciesHttpUrl(options);
    const currencies$ = Rx.defer(async () => {
      const response = await axios
        .get(url)
        .then(result => result.data as KyberCurrenciesResponse);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    }).pipe(
      retryWhen(error =>
        error.pipe(
          tap(error => debug(error)),
          delay(10000),
        ),
      ),
    );

    const rates$ = currencies$.pipe(switchMap(pollRate(options)));
    return rates$.pipe(
      map(
        (orders: Order[]): SnapshotMessage => ({
          event: NormalizedMessageType.SNAPSHOT,
          exchange: Exchange.KYBER_NETWORK,
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
