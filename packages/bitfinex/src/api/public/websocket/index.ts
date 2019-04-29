import * as Rx from 'rxjs';
import * as R from 'ramda';
import { webSocket } from 'rxjs/webSocket';
import WebSocket from 'isomorphic-ws';
import { filter, share, takeWhile, repeat, tap, map } from 'rxjs/operators';
import { log } from '../../../debug';

interface InfoMessage {
  event: 'info';
  code?: number;
}

interface ServerStatusMessage extends InfoMessage {
  version: number;
  platform: {
    status: 0 | 1;
  };
}

interface SubscribeMessage {
  event: 'subscribe';
  [key: string]: any;
}

interface SubscribedMessage {
  event: 'subscribed';
  chanId: number;
  [key: string]: any;
}

interface ErrorMessage {
  event: 'error';
  code: number;
  msg: string;
}

type ChannelMessage<T> = [number, T];

export type AnyMessage<T> =
  | InfoMessage
  | ServerStatusMessage
  | ErrorMessage
  | SubscribedMessage
  | ChannelMessage<T>;

const isErrorMessage = R.propEq('event', 'error') as <T>(
  message: AnyMessage<T>,
) => message is ErrorMessage;

const isServerRestartMessage = R.allPass([
  R.propEq('event', 'info'),
  R.propEq('code', 20051),
]) as <T>(message: AnyMessage<T>) => message is InfoMessage;

const isMaintenanceStartMessage = R.allPass([
  R.propEq('event', 'info'),
  R.propEq('code', 20061),
]) as <T>(message: AnyMessage<T>) => message is InfoMessage;

const isMaintenanceEndMessage = R.allPass([
  R.propEq('event', 'info'),
  R.propEq('code', 20060),
]) as <T>(message: AnyMessage<T>) => message is InfoMessage;

const isServerStatusMessage = R.allPass([
  R.propEq('event', 'info'),
  R.has('version'),
]) as <T>(message: AnyMessage<T>) => message is ServerStatusMessage;

class BitfinexWebSocketError extends Error {
  public constructor(message: string, public code?: number) {
    super(message);
  }
}

export const socket = <T>(subscribe: () => SubscribeMessage) => {
  const open$ = new Rx.Subject();
  const close$ = new Rx.Subject();

  const socket$ = webSocket<AnyMessage<T>>({
    url: 'wss://api-pub.bitfinex.com/ws/2',
    WebSocketCtor: WebSocket,
    closeObserver: close$,
    openObserver: open$,
  });

  open$.subscribe(() => {
    socket$.next(subscribe());
    log('Opening connection.');
  });

  close$.subscribe(() => {
    log('Closing connection.');
  });

  // Take messages until a maintenance window ends or
  // the server demands a reconnect.
  const responses$ = socket$.pipe(
    tap(value => {
      if (isErrorMessage(value)) {
        throw new BitfinexWebSocketError(value.msg, value.code);
      }

      if (isServerStatusMessage(value) && value.version !== 2) {
        throw new BitfinexWebSocketError('Unsupported version.');
      }
    }),
    takeWhile(value => !isServerRestartMessage(value)),
    takeWhile(value => !isMaintenanceStartMessage(value)),
    share(),
  );

  // Take messages until a maintenance window starts.
  const messages$ = responses$.pipe(
    takeWhile(value => !isMaintenanceEndMessage(value)),
    takeWhile(value => !(isServerStatusMessage(value) && value.version === 2)),
  );

  // Keep the connection alive while we wait for a
  // maintenance window to end.
  const wait$ = responses$.pipe(filter(() => false));

  return Rx.merge(messages$, wait$).pipe(
    filter(value => Array.isArray(value)),
    map(value => value[1] as T),
    repeat(),
    share(),
  );
};
