import * as R from 'ramda';
import * as Rx from 'rxjs';
// import BigNumber from 'bignumber.js';
import { OrderbookObserver, Symbol } from '@melonproject/ea-common';
import { subscribe } from '../../api/websocket';
import { share } from 'rxjs/operators';
import { fromStandarPair } from '../mapping';
import { SubscriptionParams, OrderBookMessage } from '../../api/types';

export interface WatchOptions {
  base: Symbol;
  quote: Symbol;
}

const isSnapshot = R.compose(
  R.cond([[R.has('ORDER_BOOK_SNAPSHOT'), R.T], [R.has('bs'), R.T], [R.T, R.F]]),
  R.nth(1),
) as (payload: [string, BookMessage]) => payload is [string, BookSnapshotMessage];

// const isUpdate = R.compose(
//   R.cond([[R.has('a'), R.T], [R.has('b'), R.T], [R.T, R.F]]),
//   R.nth(1),
// ) as (payload: [string, BookMessage]) => payload is [string, BookUpdateMessage];

// const update = (
//   subscriber: Rx.Subscriber<Orderbook<Symbol>>,
//   depth: number,
//   state: (message: Orderbook<Symbol>) => Orderbook<Symbol>,
// ) => (message: Orderbook<Symbol>) => {
//   const current = state(message);

//   current.asks = message.asks
//     .reduce((carry, current) => {
//       // Temporarily remove the updated price level from the state.
//       const out = carry.filter(item => !item.price.isEqualTo(current.price));
//       // Only (re-)add the price level if it's not zero.
//       return current.volume.isZero() ? out : out.concat(current);
//     }, current.asks)
//     .sort((a, b) => a.price.comparedTo(b.price))
//     .slice(0, depth);

//   current.bids = message.bids
//     .reduce((carry, current) => {
//       // Temporarily remove the updated price level from the state.
//       const out = carry.filter(item => !item.price.isEqualTo(current.price));
//       // Only (re-)add the price level if it's not zero.
//       return current.volume.isZero() ? out : out.concat(current);
//     }, current.asks)
//     .sort((a, b) => b.price.comparedTo(a.price))
//     .slice(0, depth);

//   subscriber.next({
//     quote: current.quote,
//     base: current.base,
//     asks: current.asks.slice(),
//     bids: current.bids.slice(),
//   });
// };

// const snapshot = (
//   subscriber: Rx.Subscriber<Orderbook<Symbol>>,
//   depth: number,
//   state: (message: Orderbook<Symbol>) => Orderbook<Symbol>,
// ) => (message: Orderbook<Symbol>) => {
//   const current = state(message);

//   current.asks = message.asks
//     .sort((a, b) => a.price.comparedTo(b.price))
//     .filter(item => !item.volume.isEqualTo(0))
//     .slice(0, depth);

//   current.bids = message.bids
//     .sort((a, b) => b.price.comparedTo(a.price))
//     .filter(item => !item.volume.isEqualTo(0))
//     .slice(0, depth);

//   subscriber.next({
//     quote: current.quote,
//     base: current.base,
//     asks: current.asks.slice(),
//     bids: current.bids.slice(),
//   });
// };

export const observe: OrderbookObserver<WatchOptions> = options =>
  new Rx.Observable(subscriber => {
    const pair = fromStandarPair(options);

    // const state: Orderbook<Symbol> = {
    //   base: options.base,
    //   quote: options.quote,
    //   asks: [],
    //   bids: [],
    // };

    const opts = {
      type: 'SUBSCRIBE',
      channels: [
        {
          name: 'ORDER_BOOK',
          instrument_codes: [pair],
        },
      ],
    } as SubscriptionParams;

    const messages$ = subscribe(opts).pipe(share());

    // const updates$ = messages$.pipe(
    //   filter(isUpdate),
    //   map(([_, message]) => {
    //     const asks = (message.a || []).map(([price, volume]) => ({
    //       price: new BigNumber(price),
    //       volume: new BigNumber(volume),
    //     }));

    //     const bids = (message.b || []).map(([price, volume]) => ({
    //       price: new BigNumber(price),
    //       volume: new BigNumber(volume),
    //     }));

    //     return { asks, bids };
    //   }),
    // );

    // const snapshots$ = messages$.pipe(
    //   filter(isSnapshot),
    //   map(([_, message]) => {
    //     const asks = (message.as || []).map(([price, volume]) => ({
    //       price: new BigNumber(price),
    //       volume: new BigNumber(volume),
    //     }));

    //     const bids = (message.bs || []).map(([price, volume]) => ({
    //       price: new BigNumber(price),
    //       volume: new BigNumber(volume),
    //     }));

    //     return { asks, bids };
    //   }),
    // );

    // const updates = updates$.subscribe(update(subscriber, opts.depth, () => state));
    // const snapshots = snapshots$.subscribe(snapshot(subscriber, opts.depth, () => state));

    const flux = messages$.subscribe(subscriber);

    return () => {
      flux.unsubscribe();
      //   updates.unsubscribe();
      //   snapshots.unsubscribe();
    };
  });
