import { privateRequest } from '../common';
import { Authentication } from '../types';

export type orderType = 'LIMIT' | 'MARKET' | 'STOP';
export type orderSide = 'SELL' | 'BUY';

export interface postOrdersParams {
  instrument_code: string;
  side: orderSide;
  amount: string;
}

export interface postOrdersLimitParams extends postOrdersParams {
  type: 'LIMIT';
  price: string;
}

export interface postOrdersMarketParams extends postOrdersParams {
  type: 'MARKET';
}

export interface postOrdersStopParams extends postOrdersParams {
  type: 'STOP';
  price: string;
  trigger_price: string;
}

export interface postOrdersResult {
  order_id: string;
  account_id: string;
  instrument_code: string;
  time: string;
  side: orderSide;
  price: string;
  amount: string;
  filled_amount: string;
  type: orderType;
}

export const postorders = async (auth: Authentication, order: postOrdersParams): Promise<postOrdersResult> => {
  const response = (await privateRequest('post', `account/orders`, auth, {}, order)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as postOrdersResult;
};
