import * as Rx from 'rxjs';
import { OrderbookUpdate, OrderbookObserver, OrderbookEntry, AssetPair, Token } from '@melonproject/ea-common';
import { getUniswapRate } from '../../api/calls/getUniswapRate';
import { map, expand, concatMap } from 'rxjs/operators';
import { Environment } from '../../types';
import BigNumber from 'bignumber.js';

export interface WatchOptions {
  interval?: number;
  quantities?: BigNumber[];
  environment: Environment;
}

const defaults = {
  interval: 5000,
  quantities: [1, 10, 25, 50, 100].map(qty => new BigNumber(qty)),
};

const fetchOrders = (pair: AssetPair, options: WatchOptions): Rx.Observable<OrderbookEntry[]> => {
  const asks = options.quantities!.map(qty => {
    return Rx.defer(() =>
      getUniswapRate(options.environment, {
        takerAsset: pair.base,
        makerAsset: pair.quote,
        takerQuantity: qty.toString(),
        targetExchange: options.environment.addresses.UniswapFactory,
      }),
    ).pipe(
      map(
        result =>
          ({
            price: result,
            volume: qty,
          } as OrderbookEntry),
      ),
    );
  });

  const bids = options.quantities!.map(qty => {
    return Rx.defer(() =>
      getUniswapRate(options.environment, {
        takerAsset: pair.quote,
        makerAsset: pair.base,
        takerQuantity: qty.toString(),
        targetExchange: options.environment.addresses.UniswapFactory,
      }),
    ).pipe(
      map(
        result =>
          ({
            price: new BigNumber(1).dividedBy(result),
            volume: qty.negated(),
          } as OrderbookEntry),
      ),
    );
  });

  return Rx.forkJoin([...asks, ...bids]);
};

export const observeOrderbook: OrderbookObserver<WatchOptions> = (pairs, options) => {
  const opts = { ...defaults, ...options };

  return Rx.merge(
    ...pairs.map(pair => {
      return Rx.defer(() => fetchOrders(pair, opts)).pipe(
        expand(() => Rx.timer(opts.interval).pipe(concatMap(() => fetchOrders(pair, opts)))),
        track(opts.quantities!.length, pair.base, pair.quote),
      );
    }),
  );
};

const filterUpdate = (update: OrderbookEntry, state: OrderbookEntry[]): boolean => {
  const match = state.find(item => item.volume.isEqualTo(update.volume.abs()));

  if (typeof match === 'undefined') {
    // If this price level doesn't exist in the state and is non-zero and finite, it's
    // a newly emerged price/volume level.
    return !update.price.isZero() && update.price.isFinite();
  }

  return !match.price.isEqualTo(update.price);
};

const track = (
  depth: number,
  base: Token,
  quote: Token,
): Rx.OperatorFunction<OrderbookEntry[], OrderbookUpdate> => source => {
  return new Rx.Observable(observer => {
    let state: {
      asks: OrderbookEntry[];
      bids: OrderbookEntry[];
    } = undefined;

    return source.subscribe({
      next: updates => {
        if (typeof state === 'undefined') {
          state = {
            bids: updates
              .filter(item => item.volume.isPositive() && !item.price.isZero() && item.price.isFinite())
              .sort((a, b) => b.price.comparedTo(a.price)),
            asks: updates
              .filter(item => item.volume.isNegative() && !item.price.isZero() && item.price.isFinite())
              .map(item => ({
                ...item,
                volume: item.volume.abs(),
              }))
              .sort((a, b) => a.price.comparedTo(b.price)),
          };

          observer.next({
            ...state,
            base,
            quote,
            asks: state.asks,
            bids: state.bids,
            depth,
            snapshot: true,
          });
        } else {
          const changes = updates
            .filter(item => {
              if (item.volume.isPositive()) {
                return filterUpdate(item, state.bids);
              }

              if (item.volume.isNegative()) {
                return filterUpdate(item, state.asks);
              }

              return false;
            })
            .map(item => ({
              price: item.price.isFinite() ? item.price : new BigNumber(0),
              volume: item.volume,
            }));

          const bids = changes.filter(item => item.volume.isPositive());
          const asks = changes
            .filter(item => item.volume.isNegative())
            .map(item => ({
              ...item,
              volume: item.volume.abs(),
            }));

          if (asks.length || bids.length) {
            state.asks = asks.length
              ? state.asks.filter(item => !asks.find(ask => ask.volume.isEqualTo(item.volume))).concat(asks)
              : state.asks;

            state.bids = bids.length
              ? state.bids.filter(item => !bids.find(bid => bid.volume.isEqualTo(item.volume))).concat(bids)
              : state.bids;

            observer.next({
              base,
              quote,
              asks,
              bids,
              depth,
              snapshot: false,
            });
          }
        }
      },
      error: error => observer.error(error),
      complete: () => observer.complete(),
    });
  });
};
