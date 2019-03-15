import * as Rx from 'rxjs';
import * as R from 'ramda';
import { share, filter, flatMap, map } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import isomorphicWs from 'isomorphic-ws';
import { Network, Trade, Exchange, BuyOrSell, OrderType } from '../../../types';
import * as debug from '../../../debug';
import { Kraken } from '../types';
import { wethToEth } from '../../../utils/wethToEth';

interface SubscribeMessage {
  event: 'subscribe';
  pair: string[];
  subscription: {
    name?: string;
    interval?: number;
    depth?: number;
  };
}

type KrakenTrade = [number, number, number, string, string, string];

const subscribeMessage = (options: Kraken.WatchOptions) => {
  const base = wethToEth(options.base);
  const quote = wethToEth(options.quote);
  const message: SubscribeMessage = {
    event: 'subscribe',
    pair: [`${base}/${quote}`],
    subscription: {
      name: 'trade',
    },
  };

  return message;
};

const getWebsocketUrl = (options: Kraken.WatchOptions) => {
  switch (options.network) {
    case Network.MAINNET:
      return 'wss://ws.kraken.com';
    default:
      throw new Error('Invalid network.');
  }
};

export const feed = (options: Kraken.WatchOptions) => {
  const ws$ = new Rx.Observable(observer => {
    const open$ = new Rx.Subject();
    const close$ = new Rx.Subject();

    const ws$ = webSocket({
      WebSocketCtor: isomorphicWs,
      closeObserver: close$,
      openObserver: open$,
      url: getWebsocketUrl(options),
    });

    ws$.next(subscribeMessage(options));
    open$.subscribe(() => {
      debug.log('Opening connection.');
    });

    close$.subscribe(() => {
      debug.log('Closing connection.');
    });

    return ws$.subscribe(observer);
  }).pipe(share());

  const messages$ = ws$.pipe(
    filter(R.is(Array) as (payload: any) => payload is [number, KrakenTrade[]]),
    flatMap(trades => (trades && trades[1]) || []),
    map(
      trade =>
        ({
          base: options.base,
          quote: options.quote,
          exchange: Exchange.KRAKEN,
          network: Network.MAINNET,
          price: `${trade[0]}`,
          volume: `${trade[1]}`,
          time: parseInt(`${trade[2]}`, 10),
          side: trade[3] === 'b' ? BuyOrSell.BUY : BuyOrSell.SELL,
          type: trade[4] === 'm' ? OrderType.MARKET : OrderType.LIMIT,
        } as Trade),
    ),
  );

  return messages$;
};
