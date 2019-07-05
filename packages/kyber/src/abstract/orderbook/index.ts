import * as Rx from 'rxjs';
import { OrderbookUpdate, OrderbookObserver, OrderbookEntry, AssetPair } from '@melonproject/ea-common';
import { getExpectedRate } from '../../api/calls/getExpectedRate';
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
      getExpectedRate(options.environment, {
        srcToken: pair.base,
        destToken: pair.quote,
        srcQty: qty.toString(),
      }),
    ).pipe(
      map(
        result =>
          ({
            price: result.expectedRate,
            volume: qty,
          } as OrderbookEntry),
      ),
    );
  });

  const bids = options.quantities!.map(qty => {
    return Rx.defer(() =>
      getExpectedRate(options.environment, {
        srcToken: pair.quote,
        destToken: pair.base,
        srcQty: qty.toString(),
      }),
    ).pipe(
      map(
        result =>
          ({
            price: new BigNumber(1).dividedBy(result.expectedRate),
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
        map(entries => entries.filter(item => item.price.isFinite())),
        track(pair.base, pair.quote),
      );
    }),
  );
};

const track = (base: string, quote: string) => (source: Rx.Observable<OrderbookEntry[]>) => {
  return new Rx.Observable<OrderbookUpdate>(observer => {
    let previous: OrderbookEntry[];

    return source.subscribe({
      next: updates => {
        if (typeof previous === 'undefined') {
          observer.next({
            base,
            quote,
            updates,
            snapshot: true,
          } as OrderbookUpdate);
        } else {
          const changed = updates.filter(update => {
            return !previous.find(prev => {
              return prev.price.isEqualTo(update.price) && prev.volume.isEqualTo(update.volume);
            });
          });

          const removed = previous
            .filter(prev => {
              return !previous.find(order => order.price.isEqualTo(prev.price));
            })
            .map(item => ({
              ...item,
              volume: new BigNumber(0),
            }));

          if (!!changed.length || !!removed.length) {
            observer.next({
              base,
              quote,
              updates: [...changed, ...removed],
            } as OrderbookUpdate);
          }
        }

        previous = updates;
      },
      error: error => observer.error(error),
      complete: () => observer.complete(),
    });
  });
};
