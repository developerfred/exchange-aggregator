import * as Rx from 'rxjs';
import { map, filter, share, concatMap } from 'rxjs/operators';
import { connect } from './connect';
import { SubscriptionParams } from '../types';

export const subscribe = <T>(subscription: SubscriptionParams): Rx.Observable<T> => {
  const subMsg = () => subscription;

  const unsubMsg = () => ({
    // TODO
  });

  const filterFn = (message: any) => {
    // TODO
    return message;
  };

  const multiplex$ = connect().multiplex(subMsg, unsubMsg, filterFn);
  return multiplex$.pipe(
    concatMap(value => {
      if (value.type === 'ERROR') {
        return Rx.throwError(new Error(value.error));
      }

      return Rx.of(value);
    }),
    // filter(value => Array.isArray(value)),
    map((value: any) => {
      return value as T;
    }),
    share(),
  );
};
