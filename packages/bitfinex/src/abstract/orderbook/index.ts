import * as Rx from 'rxjs';
import { OrderbookObserver, OrderbookUpdate } from '@melonproject/ea-common';
import { watchAssetPair, SubscriptionOptionsWithoutSymbol } from '../../api/public/websocket/book';
import { map } from 'rxjs/operators';

export const observeOrderbook: OrderbookObserver<SubscriptionOptionsWithoutSymbol> = (pairs, options) => {
  return Rx.merge(
    ...pairs.map(pair =>
      watchAssetPair(`${pair.base}/${pair.quote}`, options).pipe(
        map(event => {
          if (Array.isArray(event)) {
            return {
              snapshot: true,
              base: pair.base,
              quote: pair.quote,
              updates: event.map(item => ({
                price: item.price,
                volume: item.amount,
              })),
            } as OrderbookUpdate;
          }

          const update = {
            price: event.price,
            volume: event.count.isZero() ? event.count : event.amount,
          };

          return {
            base: pair.base,
            quote: pair.quote,
            updates: [update],
          } as OrderbookUpdate;
        }),
      ),
    ),
  );
};
