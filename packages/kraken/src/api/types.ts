export interface Authentication {
  key: string;
  secret: string;
}

export type OrderStatus =
  | 'pending'
  | 'open'
  | 'close'
  | 'cancelled'
  | 'expired';

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
