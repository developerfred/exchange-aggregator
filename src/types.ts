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

export interface AssetPair {
  base: TokenInterface;
  quote: TokenInterface;
}

export interface Options {
  pair: AssetPair;
  network: Network;
  environment?: Environment;
}

export interface Order {
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
  quote: TokenInterface;
  base: TokenInterface;
  network: Network;
  exchange: Exchange;
}

export interface SetOrderMessage extends OrderMessage {
  event: NormalizedMessageType.SET;
  id: string;
  order: Order;
}

export interface RemoveOrderMessage extends OrderMessage {
  event: NormalizedMessageType.REMOVE;
  id: string;
}

export interface SnapshotMessage extends OrderMessage {
  event: NormalizedMessageType.SNAPSHOT;
  orders: Order[];
}

export interface Orderbook {
  quote: TokenInterface;
  base: TokenInterface;
  network: Network;
  bids: Order[];
  asks: Order[];
}

export interface Trade {
  network: Network;
  exchange: Exchange;
  pair: AssetPair;
  type: OrderType;
  side: BuyOrSell;
  volume: string;
  price?: string;
}
