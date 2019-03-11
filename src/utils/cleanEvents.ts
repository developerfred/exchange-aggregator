import * as R from 'ramda';
import * as debug from '../debug';
import { OperatorFunction, Observable } from 'rxjs';
import {
  NormalizedMessageType,
  SnapshotMessage,
  SetOrderMessage,
  RemoveOrderMessage,
  Order,
  AnyOrderMessage,
} from '../types';

export const cleanEvents = (
  initial: Order[] = [],
): OperatorFunction<AnyOrderMessage, AnyOrderMessage> => (
  source: Observable<AnyOrderMessage>,
) => {
  return new Observable(observer => {
    let orders = initial;

    return source.subscribe(
      message => {
        if (message.event === NormalizedMessageType.SNAPSHOT) {
          const snapshot = message as SnapshotMessage;

          if (!orders || !orders.length) {
            observer.next(message);
          } else {
            snapshot.orders.forEach(current => {
              if (!orders.find(R.equals(current))) {
                observer.next({
                  event: NormalizedMessageType.SET,
                  exchange: snapshot.exchange,
                  network: snapshot.network,
                  base: snapshot.base,
                  quote: snapshot.quote,
                  id: current.id,
                  order: current,
                });
              }
            });

            orders.forEach(current => {
              if (!snapshot.orders.find(R.propEq('id', current.id))) {
                observer.next({
                  event: NormalizedMessageType.REMOVE,
                  exchange: snapshot.exchange,
                  network: snapshot.network,
                  base: snapshot.base,
                  quote: snapshot.quote,
                  id: current.id,
                });
              }
            });
          }

          orders = snapshot.orders;
        } else if (message.event === NormalizedMessageType.SET) {
          const add = message as SetOrderMessage;
          if (!orders.find(R.equals(add.order))) {
            orders.push(add.order);
            observer.next(add);
          } else {
            debug.log('Filtered event: Set order %s.', add.id);
          }
        } else if (message.event === NormalizedMessageType.REMOVE) {
          const remove = message as RemoveOrderMessage;
          const before = orders.length;
          orders = orders.filter(
            R.compose(
              R.not,
              R.propEq('id', remove.id),
            ),
          );

          if (orders.length !== before) {
            observer.next(remove);
          } else {
            debug.log('Filtered event: Remove order %s.', remove.id);
          }
        }
      },
      observer.error,
      observer.complete,
    );
  });
};
