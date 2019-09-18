import { privateRequest } from '../common';
import { Authentication } from '../types';
// TODO: TO TEST
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP';
export type OrderSide = 'SELL' | 'BUY';

export type Order = PostOrdersLimitParams | PostOrdersMarketParams | PostOrdersStopParams;

export interface PostOrdersParams {
  instrument_code: string;
  side: OrderSide;
  amount: string;
}

export interface PostOrdersLimitParams extends PostOrdersParams {
  type: 'LIMIT';
  price: string;
}

export interface PostOrdersMarketParams extends PostOrdersParams {
  type: 'MARKET';
}

export interface PostOrdersStopParams extends PostOrdersParams {
  type: 'STOP';
  price: string;
  trigger_price: string;
}

export interface PostOrdersResult {
  order_id: string;
  account_id: string;
  instrument_code: string;
  time: string;
  side: OrderSide;
  price: string;
  amount: string;
  filled_amount: string;
  type: OrderType;
}

export const postorders = async (auth: Authentication, order: Order): Promise<PostOrdersResult> => {
  const response = (await privateRequest('post', `account/orders`, auth, {}, order)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as PostOrdersResult;
};
