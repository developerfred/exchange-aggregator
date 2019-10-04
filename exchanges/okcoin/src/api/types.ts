export interface Authentication {
  key: string;
  secret: string;
  passphrase: string;
}

export interface CallLimit {
  limit: number;
  frequency: number;
  period: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'NONE';
}

// Account
export interface CurrenciesResponse {
  name: string;
  currency: string;
  can_withdraw: string;
  can_deposit: string;
  min_withdrawal: string;
}

export interface WalletResponse {
  balance: string;
  available: string;
  currency: string;
  hold: string;
}

export interface WithdrawalFeeResponse {
  currency: string;
  min_fee?: string;
  max_fee?: string;
}

export enum LedgerTypeParams {
  'deposit' = 1,
  'withdrawal' = 2,
  'cancel withdrawal' = 13,
  'into sub account' = 20,
  'out of sub account' = 21,
  'claim' = 28,
  'into margin account' = 33,
  'out of margin account' = 34,
  'into spot account' = 38,
  'out of spot account' = 37,
}

export interface LedgerParams {
  currency?: string;
  type?: LedgerTypeParams;
  after?: string;
  before?: string;
  limit?: string;
}

export interface LedgerResponse {
  amount: string;
  balance: string;
  fee: string;
  currency: string;
  ledger_id: string;
  typename: string;
  timestamp: string;
}

export interface DepositAddressResponse {
  address: string;
  currency: string;
  to: number;
}

export interface DepositHistoryResponse {
  amount: string;
  txid: string;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  status: string;
}

// Spot
export interface InstrumentsResponse {
  base_currency: string;
  instrument_id: string;
  min_size: string;
  quote_currency: string;
  size_increment: string;
  tick_size: string;
}

export interface AccountsResponse {
  frozen: string;
  hold: string;
  id: string;
  currency: string;
  balance: string;
  available: string;
  holds: string;
}

export type PlaceOrderSideParams = 'buy' | 'sell';
export type PlaceOrderTypeParams = 'market' | 'limit';
export enum PlaceOrderTypeConditionsParams {
  'Normal order (Unfilled and 0 imply normal limit order)' = 0,
  'Post only' = 1,
  'Fill or Kill' = 2,
  'Immediate Or Cancel' = 3,
}

export type PlaceOrderParams = PlaceLimitOrderParams | PlaceMarketOrderParams;

export interface PlaceOrderDefaultParams {
  side: PlaceOrderSideParams;
  instrument_id: string;
  margin_trading: 1;
  order_type?: PlaceOrderTypeConditionsParams;
  client_oid?: string;
  funds?: string;
}

export interface PlaceLimitOrderParams extends PlaceOrderDefaultParams {
  type: 'limit';
  price: string;
  size: string;
}

export interface PlaceMarketOrderParams extends PlaceOrderDefaultParams {
  type: 'market';
  size: string; // Quantity to be sold (sell)
  notional: string; // Amount to spend (buy)
}

export interface OrderResult {
  client_oid: string;
  error_code: string;
  error_message: string;
  order_id: string;
  result: boolean;
}

export enum OrdersListStateParams {
  'Failed' = -2,
  'Canceled' = -1,
  'Open' = 0,
  'Partially Filled' = 1,
  'Completely Filled' = 2,
  'Submitting' = 3,
  'Canceling' = 4,
  'Incomplete (open + partially filled)' = 6,
  'Complete (canceled + completely filled)' = 7,
}

export interface OrdersListParams {
  instrument_id: string;
  state: OrdersListStateParams;
  after: string;
  before: string;
  limit: string;
}

export interface OpenOrdersParams {
  instrument_id: string;
  after?: string;
  before?: string;
  limit?: string;
}

export interface OpenOrdersResponse {
  client_oid: string;
  created_at: string;
  filled_notional: string;
  filled_size: string;
  funds: string;
  instrument_id: string;
  notional: string;
  order_id: string;
  order_type: string;
  price: string;
  price_avg: string;
  product_id: string;
  side: string;
  size: string;
  state: string;
  status: string;
  timestamp: string;
  type: string;
}
