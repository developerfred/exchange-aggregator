import * as Rx from 'rxjs';
import { map } from 'rxjs/operators';
import isomorphicWs from 'isomorphic-ws';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as debug from '../debug';

const url = 'wss://ws.kraken.com';

let socket$: WebSocketSubject<any>;
export const connect = () => {
  if (!socket$) {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();

    socket$ = webSocket({
      url,
      WebSocketCtor: isomorphicWs,
      closeObserver: close$,
      openObserver: open$,
    });

    open$.subscribe(() => {
      debug.log('Opening connection.');
    });

    close$.subscribe(() => {
      debug.log('Closing connection.');
    });
  }

  return socket$;
};

export interface SubscriptionParams {
  name: 'ticker' | 'ohlc' | 'trade' | 'book' | 'spread' | '*';
  interval?: 1 | 5 | 15 | 30 | 60 | 240 | 1440 | 10080 | 21600;
  depth?: 10 | 25 | 100 | 500 | 1000;
}

let counter = 0;
export const subscribe = (pair: string[], subscription: SubscriptionParams) => {
  let channels = [];
  const reqid = ++counter;

  const sub = () => ({
    reqid,
    pair,
    subscription,
    event: 'subscribe',
  });

  const unsub = () => ({
    reqid,
    pair,
    subscription,
    event: 'unsubscribe',
  });

  const filter = message => {
    const req = message.reqid && message.reqid === reqid;
    if (message.event === 'subscriptionStatus' && req) {
      if (message.status === 'subscribed') {
        channels = [...channels, message.channelID];
      } else if (message.status === 'unsubscribed') {
        channels = channels.filter(channel => channel !== message.channelID);
      }

      return true;
    }

    return Array.isArray(message) && channels.indexOf(message[0]) !== -1;
  };

  const multiplex$ = connect().multiplex(sub, unsub, filter);
  return multiplex$.pipe(
    map(value => {
      if (Array.isArray(value)) {
        return value[1];
      }

      if (value.status && value.status === 'error') {
        throw new Error(value.errorMessage);
      }

      return value;
    }),
  );
};
