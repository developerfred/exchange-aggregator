export interface Authentication {
  key: string;
  secret: string;
}

export type OrderStatus = 'pending' | 'open' | 'closed' | 'cancelled' | 'expired';

export type SellOrBuy = 'sell' | 'buy';
export type SellOrBuyAbbreviated = 's' | 'b';
export type MarketOrLimitAbbreviated = 'm' | 'l';

export type OrderType =
  | 'market'
  | 'limit'
  | 'stop-loss'
  | 'take-profit'
  | 'stop-loss-profit'
  | 'stop-loss-profit-limit'
  | 'stop-loss-limit'
  | 'take-profit-limit'
  | 'trailing-stop'
  | 'trailing-stop-limit'
  | 'stop-loss-and-limit'
  | 'settle-position';

export interface OrderInfo {
  refid?: string;
  userref: number;
  status: OrderStatus;
  reason?: string;
  opentm: number;
  closetm?: number;
  starttm: number;
  expiretm: number;
  descr: {
    pair: string;
    type: SellOrBuy;
    ordertype: OrderType;
    price: string;
    price2: string;
    leverage: string;
    order: string;
    close: string;
  };
  vol: string;
  vol_exec: string;
  cost: string;
  fee: string;
  price: string;
  stopprice: string;
  limitprice: string;
  misc: string;
  oflags: string;
  fciq: string;
  trades?: string[];
}

export interface TradeInfo {
  ordertxid: string;
  postxid: string;
  pair: string;
  time: number;
  type: SellOrBuy;
  ordertype: OrderType;
  price: string;
  cost: string;
  fee: string;
  vol: string;
  margin: string;
  misc: string;
  posstatus?: 'open' | 'closed';
  cprice?: string;
  ccost?: string;
  cfee?: string;
  cvol?: string;
  cmargin?: string;
  net?: string;
  trades?: string[];
}

export type LedgerType = 'all' | 'deposit' | 'withdrawal' | 'trade' | 'margin';

export type AssetType = 'currency';

export interface LedgerInfo {
  refid: string;
  time: number;
  type: LedgerType;
  aclass: AssetType;
  asset: string;
  amount: string;
  fee: string;
  balance: string;
}

export interface AssetPairInfo {
  altname: string;
  wsname?: string;
  aclass_base: string;
  base: string;
  aclass_quote: string;
  quote: string;
  lot: string;
  pair_decimals: number;
  lot_decimals: number;
  lot_multiplier: number;
  leverage_buy: string[];
  leverage_sell: string[];
  fees: [number, number][];
  fees_maker: [number, number][];
  fee_volume_currency: string;
  margin_call: number;
  margin_stop: number;
}

export interface TickerInfo {
  a: [string, string, string];
  b: [string, string, string];
  c: [string, string];
  v: [string, string];
  p: [string, string];
  t: [number, number];
  l: [string, string];
  h: [string, string];
  o: string;
}

export interface SubscriptionParams {
  name: 'ticker' | 'ohlc' | 'trade' | 'book' | 'spread' | '*';
  interval?: 1 | 5 | 15 | 30 | 60 | 240 | 1440 | 10080 | 21600;
  depth?: 10 | 25 | 100 | 500 | 1000;
}

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

export type BookItem = [string, string, string];

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
