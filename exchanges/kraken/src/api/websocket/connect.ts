import * as Rx from 'rxjs';
import Ws from 'isomorphic-ws';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as debug from '../../debug';
import { AnyMessage } from '../types';

let socket$: WebSocketSubject<AnyMessage>;
export const connect = () => {
  if (!socket$) {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();

    socket$ = webSocket({
      url: 'wss://ws.kraken.com',
      WebSocketCtor: Ws as any,
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
