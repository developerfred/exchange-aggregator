import * as Rx from 'rxjs';
import BigNumber from 'bignumber.js';
import { map, filter, share, concatMap } from 'rxjs/operators';
import isomorphicWs from 'isomorphic-ws';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as debug from '../debug';
import { SellOrBuyAbbreviated, MarketOrLimitAbbreviated } from './types';

export interface Event {
  event: string;
}

export interface PingMessage extends Event {
  event: 'ping';
  reqid?: number;
}

export interface PongMessage extends Event {
  event: 'pong';
  reqid?: number;
}

export interface HeartbeatMessage extends Event {
  event: 'heartbeat';
}

export interface SystemStatusMessage extends Event {
  connectionID: string;
  event: 'systemStatus';
  status: 'online' | 'maintenance' | string;
  version: string;
}

export interface SubscribeMessage extends Event {
  event: 'subscribe';
  pair: string[];
  subscription: SubscriptionParams;
  reqid?: number;
}

export interface UnsubscribeMessage extends SubscribeMessage {
  event: 'subscribe';
}

export interface SubscriptionStatusMessage extends Event {
  channelID: number;
  event: 'subscriptionStatus';
  status: 'subscribed' | 'unsubscribed' | 'error';
  pair: string;
  reqid: number;
  subscription: SubscriptionParams;
  errorMessage?: string;
}

export interface TickerMessage {
  a: [string, number, string];
  b: [string, number, string];
  c: [string, string];
  v: [string, string];
  p: [string, string];
  t: [number, number];
  l: [string, string];
  h: [string, string];
  o: [string, string];
}

export type OhlcMessage = [string, string, string, string, string, string, string, string, number];

export type TradeMessage = [string, string, string, SellOrBuyAbbreviated, MarketOrLimitAbbreviated, string][];

export type SpreadMessage = [string, string, string];

export type BookItem = [string, BigNumber, BigNumber];

export interface BookSnapshotMessage {
  as?: BookItem[];
  bs?: BookItem[];
}

export interface BookUpdateMessage {
  a?: BookItem[];
  b?: BookItem[];
}

export type BookMessage = BookSnapshotMessage | BookUpdateMessage;

export type SubscriptionMessage = OhlcMessage | TradeMessage | SpreadMessage | BookSnapshotMessage | BookUpdateMessage;

export type RawSubscriptionMessage = [number, SubscriptionMessage];

export type AnyMessage =
  | PingMessage
  | PongMessage
  | HeartbeatMessage
  | SystemStatusMessage
  | SubscribeMessage
  | UnsubscribeMessage
  | SubscriptionStatusMessage
  | RawSubscriptionMessage;

let socket$: WebSocketSubject<AnyMessage>;
export const connect = () => {
  if (!socket$) {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();

    socket$ = webSocket({
      url: 'wss://ws.kraken.com',
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
export const subscribe = <T = SubscriptionMessage>(
  pair: string[],
  subscription: SubscriptionParams,
): Rx.Observable<[string, T]> => {
  let channels: { [key: string]: string } = {};
  const reqid = ++counter;

  const subMsg = () => ({
    reqid,
    pair,
    subscription,
    event: 'subscribe',
  });

  const unsubMsg = () => ({
    reqid,
    pair,
    subscription,
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
      return [pair, value[1]] as [string, T];
    }),
    share(),
  );
};
