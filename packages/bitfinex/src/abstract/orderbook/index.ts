import * as Rx from 'rxjs';
import { OrderbookObserver, OrderbookUpdate } from '@melonproject/ea-common';
import { watchAssetPair, SubscriptionOptionsWithoutSymbol } from '../../api/public/websocket/book';
import { map } from 'rxjs/operators';

const defaults = {
  length: 25,
};

export const observeOrderbook: OrderbookObserver<SubscriptionOptionsWithoutSymbol> = (pairs, options) => {
  const opts = {
    ...defaults,
    ...options,
  } as SubscriptionOptionsWithoutSymbol;

  const observers = pairs.map(pair => {
    return watchAssetPair(`${pair.base}/${pair.quote}`, opts).pipe(
      map(event => {
        if (Array.isArray(event)) {
          const bids = event
            .filter(item => item.amount.isPositive())
            .map(item => ({
              price: item.price,
              volume: item.amount,
            }));

          const asks = event
            .filter(item => item.amount.isNegative())
            .map(item => ({
              price: item.price,
              volume: item.amount.abs(),
            }));

          return {
            asks,
            bids,
            base: pair.base,
            quote: pair.quote,
            depth: opts.length,
            snapshot: true,
          } as OrderbookUpdate;
        }

        const volume = event.count.isZero() ? event.count : event.amount.abs();
        const bids = event.amount.isPositive()
          ? [
              {
                price: event.price,
                volume,
              },
            ]
          : [];

        const asks = event.amount.isNegative()
          ? [
              {
                price: event.price,
                volume,
              },
            ]
          : [];

        return {
          asks,
          bids,
          depth: opts.length,
          base: pair.base,
          quote: pair.quote,
        } as OrderbookUpdate;
      }),
    );
  });

  return Rx.merge(...observers);
};
