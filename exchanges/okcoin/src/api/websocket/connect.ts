// import * as Rx from 'rxjs';
// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
// import { AnyMessage } from '../types';
// // import * as debug from '../../debug';

// // tslint:disable-next-line:variable-name
// const Ws = require('isomorphic-ws');

// let socket$: WebSocketSubject<AnyMessage>;
// export const connect = () => {
//   if (!socket$) {
//     const open$ = new Rx.Subject();
//     const close$ = new Rx.Subject();

//     socket$ = webSocket({
//       url: 'wss://streams.exchange.bitpanda.com',
//       WebSocketCtor: Ws,
//       closeObserver: close$,
//       openObserver: open$,
//     });

//     open$.subscribe(() => {
//       console.log('Opening connection.');
//     });

//     close$.subscribe(() => {
//       console.log('Closing connection.');
//     });
//   }

//   return socket$;
// };
