import * as Rx from 'rxjs';
import { map, filter, share, concatMap } from 'rxjs/operators';
import { connect } from './connect';
import { SubscriptionMessage, SubscriptionParams } from '../types';

let counter = 0;
export const subscribe = <T = SubscriptionMessage>(
  pair: string,
  subscription: SubscriptionParams,
): Rx.Observable<[string, T]> => {
  let channels: { [key: string]: string } = {};
  const reqid = ++counter;

  const subMsg = () => ({
    reqid,
    subscription,
    pair: [pair],
    event: 'subscribe',
  });

  const unsubMsg = () => ({
    reqid,
    subscription,
    pair: [pair],
    event: 'unsubscribe',
  });

  const filterFn = (message: any) => {
    if (message.event === 'subscriptionStatus') {
      const req = message.reqid && message.reqid === reqid;
      if (req && message.status === 'subscribed') {
        channels = {
          ...channels,
          [message.channelID]: message.pair,
        };
      } else if (req && message.status === 'unsubscribed') {
        const { [message.channelID]: removed, ...rest } = channels;
        channels = rest;
      }

      return true;
    }

    return Array.isArray(message) && !!channels[message[0]];
  };

  const multiplex$ = connect().multiplex(subMsg, unsubMsg, filterFn);
  return multiplex$.pipe(
    concatMap(value => {
      if (value.status && value.status === 'error') {
        return Rx.throwError(new Error(value.errorMessage));
      }

      return Rx.of(value);
    }),
    filter(value => Array.isArray(value)),
    map((value: any) => {
      const pair = channels[value[0]];
      const result = value[1];

      return [pair, result] as [string, T];
    }),
    share(),
  );
};
