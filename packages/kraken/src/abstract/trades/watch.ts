import {
  subscribe,
  SubscriptionParams,
  TradeMessage,
} from '../../api/websocket';
import { share, map } from 'rxjs/operators';
import { fromStandarPair, toStandardPair } from '../mapping';
import BigNumber from 'bignumber.js';

export interface WatchOptions {
  depth?: SubscriptionParams['depth'];
  interval?: SubscriptionParams['interval'];
}

export enum SellOrBuy {
  'SELL' = 'SELL',
  'BUY' = 'BUY',
}

export enum MarketOrLimit {
  'MARKET' = 'MARKET',
  'LIMIT' = 'LIMIT',
}

export interface AbstractTrade {
  price: BigNumber;
  volume: BigNumber;
  timestamp: BigNumber;
  side: SellOrBuy;
  type: MarketOrLimit;
}

const normalizeMessage = (
  pair: string,
  message: TradeMessage,
): [string, AbstractTrade[]] => {
  const trades = message.map(
    ([price, volume, timestamp, side, type]) =>
      ({
        price: new BigNumber(price),
        volume: new BigNumber(volume),
        timestamp: new BigNumber(timestamp),
        side: side === 'b' ? SellOrBuy.BUY : SellOrBuy.SELL,
        type: type === 'l' ? MarketOrLimit.LIMIT : MarketOrLimit.MARKET,
      } as AbstractTrade),
  );

  return [toStandardPair(pair), trades];
};

export const watch = (pairs: string[], options?: WatchOptions) => {
  const standardized = pairs.map(pair => fromStandarPair(pair));

  // Periodically restart the connection to fetch a fresh
  // snapshot (e.g. to reset the depth).
  const messages$ = subscribe<TradeMessage>(standardized, {
    ...options,
    name: 'trade',
  }).pipe(
    map(message => normalizeMessage(message[0], message[1])),
    share(),
  );

  return messages$;
};
