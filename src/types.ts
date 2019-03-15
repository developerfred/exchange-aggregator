import {
  TokenInterface,
  QuantityInterface,
  PriceInterface,
} from '@melonproject/token-math';
import { Environment } from '@melonproject/protocol';

export enum Exchange {
  'RADAR_RELAY' = 'RADAR_RELAY',
  'KRAKEN' = 'KRAKEN',
  'KYBER_NETWORK' = 'KYBER_NETWORK',
  'ETHFINEX' = 'ETHFINEX',
  'OASIS_DEX' = 'OASIS_DEX',
}

export enum Network {
  'MAINNET' = 'MAINNET',
  'KOVAN' = 'KOVAN',
}

export interface Options {
  base: string;
  quote: string;
  network: Network;
  environment?: Environment;
}

export interface OrderbookOrder {
  id: string;
  type: AskOrBid;
  trade: PriceInterface;
  exchange: Exchange;
  cummulative?: QuantityInterface;
  original?: any;
}

export enum NormalizedMessageType {
  'SET' = 'SET',
  'REMOVE' = 'REMOVE',
  'SNAPSHOT' = 'SNAPSHOT',
}

export enum AskOrBid {
  'ASK' = 'ASK',
  'BID' = 'BID',
}

export enum BuyOrSell {
  'BUY' = 'BUY',
  'SELL' = 'SELL',
}

export enum OrderType {
  'MARKET' = 'MARKET',
  'LIMIT' = 'LIMIT',
}

export type AnyOrderMessage =
  | SetOrderMessage
  | RemoveOrderMessage
  | SnapshotMessage;

export interface OrderMessage {
  event: NormalizedMessageType;
  quote: string;
  base: string;
  network: Network;
  exchange: Exchange;
}

export interface SetOrderMessage extends OrderMessage {
  event: NormalizedMessageType.SET;
  id: string;
  order: OrderbookOrder;
}

export interface RemoveOrderMessage extends OrderMessage {
  event: NormalizedMessageType.REMOVE;
  id: string;
}

export interface SnapshotMessage extends OrderMessage {
  event: NormalizedMessageType.SNAPSHOT;
  orders: OrderbookOrder[];
}

export interface Orderbook {
  quote: TokenInterface;
  base: TokenInterface;
  network: Network;
  bids: OrderbookOrder[];
  asks: OrderbookOrder[];
}

export interface OrderRequest {
  network: Network;
  exchange: Exchange;
  base: string;
  quote: string;
  type: OrderType;
  side: BuyOrSell;
  volume: string;
  price?: string;
}

export interface Trade {
  network: Network;
  exchange: Exchange;
  base: string;
  quote: string;
  price: string;
  type?: OrderType;
  side?: BuyOrSell;
  volume?: string;
  time?: number;
}
