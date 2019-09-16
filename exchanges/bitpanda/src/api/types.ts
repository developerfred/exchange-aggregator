export interface Authentication {
  apiKey: string;
}

/* REST PUBLIC */
export interface OrderBookEntryResponse {
  price: string;
  amount: string;
  number_of_orders: number;
}

export interface OrderBookResponse {
  instrument_code: string;
  time: string;
  bids: OrderBookEntryResponse[];
  asks: OrderBookEntryResponse[];
}

export interface TimeResponse {
  iso: string;
  epoch_millis: number;
}

export interface InstrumentsResponse {
  state: 'ACTIVE' | 'SUSPENDED';
  base: {
    code: string;
    precision: number;
  };
  quote: {
    code: string;
    precision: number;
  };
  amount_precision: number;
  market_precision: number;
  min_size: string;
}

export interface FeesTiersResponse {
  volume: string;
  fee_group_id: string;
  maker_fee: string;
  taker_fee: string;
}

export interface FeesResponse {
  account_id: string;
  running_trading_volume: string;
  collect_fees_in_best: boolean;
  fee_group_id: string;
  fee_tiers: FeesTiersResponse[];
}

export interface CurrenciesResponse {
  code: string;
  precision: number;
}

/* REST PRIVATE */
export interface BalanceDetailResponse {
  account_id: string;
  currency_code: string;
  change: string;
  available: string;
  locked: string;
  sequence: number;
  time: string;
}

export interface BalancesResponse {
  account_id: string;
  balances: BalanceDetailResponse[];
}

export interface OrderResponse {
  trigger_price: string;
  order_id: string;
  account_id: string;
  instrument_code: string;
  time: string;
  side: string;
  price: string;
  amount: string;
  filled_amount: string;
  type: string;
  sequence: number;
  status: string;
}

export interface OrdersHistoryResponse {
  order: OrderResponse;
  trades: any[];
}

export interface GetOrdersResponse {
  order_history: OrdersHistoryResponse[];
  max_page_size: number;
}

/* WEBSOCKET PARAMS */
export interface SubscriptionParams {
  type: 'SUBSCRIBE';
  channels: Channels[];
}

export type Channels = ChannelOrderBook | ChannelPriceTicks | ChannelAccountHistory;

export interface ChannelOrderBook {
  name: 'ORDER_BOOK';
  depth: number;
  instrument_codes: string[];
}

export interface ChannelAccountHistory {
  name: 'ACCOUNT_HISTORY';
  api_token: string;
}

export interface ChannelPriceTicks {
  name: 'PRICE_TICKS';
  instrument_codes: string[];
}

// export interface ChannelCandlesticksParams;

export interface ChannelCandlesticks {
  name: 'CANDLESTICKS';
  properties: string[];
}

/* WEBSOCKET MESSAGE */
export type AnyMessage = any;

export type ChannelNames =
  | 'ORDER_BOOK'
  | 'PRICE_TICKS'
  | 'CANDLESTICKS'
  | 'MARKET_TICKER'
  | 'SYSTEM'
  | 'ACCOUNT_HISTORYs';
export type ChannelTypes =
  | 'SUBSCRIBE'
  | 'SUBSCRIPTIONS'
  | 'ERROR'
  | 'CONNECTION_CLOSING'
  | 'UNSUBSCRIBED'
  | 'HEARTBEAT'
  | 'MARKET_UPDATES';

export interface UnsubscriptionParams {
  type: 'UNSUBSCRIBE';
  channels: ChannelNames[];
}

export interface SubscriptionMessage {
  channel_name: ChannelNames;
  type: ChannelTypes;
  subscription?: string;
  time?: string;
  error?: string;
}
