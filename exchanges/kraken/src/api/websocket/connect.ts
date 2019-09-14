import * as Rx from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as debug from '../../debug';
import { AnyMessage } from '../types';

// tslint:disable-next-line:variable-name
const Ws = require('isomorphic-ws');

let socket$: WebSocketSubject<AnyMessage>;
export const connect = () => {
  if (!socket$) {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();

    socket$ = webSocket({
      url: 'wss://ws.kraken.com',
      WebSocketCtor: Ws,
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
