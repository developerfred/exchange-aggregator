export interface Authentication {
  apiKey: string;
}

/* REST PUBLIC */
export interface OrderBookParams {
  instrument_code: string;
  level?: 1 | 2 | 3;
}

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
  order_id: string;
  account_id: string;
  instrument_code: string;
  amount: string;
  filled_amount: string;
  side: string;
  type: string;
  time: string;
  price: string;
  sequence: number;
  status?: string;
  trigger_price?: string;
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

export interface UnsubscriptionParams {
  type: 'UNSUBSCRIBE';
  channels: ChannelNames[];
}

export type Channels =
  | ChannelOrderBook
  | ChannelPriceTicks
  | ChannelAccountHistory
  | ChannelCandlesticksParams
  | ChannelMarketTicker;

export interface ChannelOrderBook {
  name: 'ORDER_BOOK';
  depth: number;
  instrument_codes: string[];
}

export interface SubscriptionOrderBook extends SubscriptionParams {
  channels: [
    {
      name: 'ORDER_BOOK';
      depth: number;
      instrument_codes: string[];
    },
  ];
}

export interface ChannelAccountHistory {
  name: 'ACCOUNT_HISTORY';
  api_token: string;
}

export interface ChannelPriceTicks {
  name: 'PRICE_TICKS';
  instrument_codes: string[];
}

export type TimeGranularity =
  | {
      unit: 'MINUTES';
      period: 1;
    }
  | {
      unit: 'MINUTES';
      period: 5;
    }
  | {
      unit: 'MINUTES';
      period: 15;
    }
  | {
      unit: 'MINUTES';
      period: 30;
    }
  | {
      unit: 'HOURS';
      period: 1;
    }
  | {
      unit: 'HOURS';
      period: 4;
    }
  | {
      unit: 'DAYS';
      period: 1;
    }
  | {
      unit: 'WEEKS';
      period: 1;
    }
  | {
      unit: 'MONTHS';
      period: 1;
    };

export interface ChannelCandlesticksParams {
  instrument_code: string;
  time_granularity: TimeGranularity;
}

export interface ChannelCandlesticks {
  name: 'CANDLESTICKS';
  properties: ChannelCandlesticksParams[];
}

export interface ChannelMarketTicker {
  name: 'MARKET_TICKER';
  instrument_codes: string[];
}

/* WEBSOCKET MESSAGE */
export type AnyMessage = any;

export type ChannelNames =
  | 'ORDER_BOOK'
  | 'PRICE_TICKS'
  | 'CANDLESTICKS'
  | 'MARKET_TICKER'
  | 'SYSTEM'
  | 'ACCOUNT_HISTORYS';

export type MessageTypes =
  | 'SUBSCRIPTIONS'
  | 'UNSUBSCRIBED'
  | 'ERROR'
  | 'CONNECTION_CLOSING'
  | 'HEARTBEAT'
  | 'MARKET_UPDATES';

export interface SubscriptionMessage {
  type: 'SUBSCRIPTIONS';
  channels: Channels;
}

export interface UnsubscriptionMessage {
  type: 'UNSUBSCRIBED';
  channel_name: ChannelNames;
}

// ORDER BOOK
export interface OrderBookSnapshotMessage {
  type: 'ORDER_BOOK_SNAPSHOT';
  name: 'ORDER_BOOK';
  instrument_code: string;
  bids: [[string, string]];
  asks: [[string, string]];
}

export interface OrderBookUpdateMessage {
  type: 'ORDER_BOOK_UPDATE';
  name: 'ORDER_BOOK';
  instrument_code: string;
  changes: [['BUY' | 'SELL', string, string]];
}

export type OrderBookMessage = OrderBookSnapshotMessage | OrderBookUpdateMessage;
