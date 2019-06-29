import * as Rx from 'rxjs';
import {
  OrderbookEventType,
  OrderbookSnapshotEvent,
  OrderbookUpdateEvent,
  OrderbookEvent,
  AssetPair,
} from '@melonproject/ea-common';
import { watchAssetPair, SubscriptionOptionsWithoutSymbol } from '../api/public/websocket/book';
import { map } from 'rxjs/operators';

export const observeOrderbook = (
  pair: AssetPair,
  options?: SubscriptionOptionsWithoutSymbol,
): Rx.Observable<OrderbookEvent[]> => {
  const pair$ = watchAssetPair(`${pair.base}/${pair.quote}`, options);

  return pair$.pipe(
    map(event => {
      if (Array.isArray(event)) {
        return [
          {
            type: OrderbookEventType.SNAPSHOT,
            orders: event.map(item => ({
              price: item.price,
              volume: item.amount,
            })),
          } as OrderbookSnapshotEvent,
        ];
      }

      return [
        {
          type: OrderbookEventType.UPDATE,
          order: {
            price: event.price,
            volume: event.amount,
          },
        } as OrderbookUpdateEvent,
      ];
    }),
  );
};
