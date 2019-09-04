import { privateRequest } from '../common';
import { Authentication, AssetType } from '../types';

export type TradeBalanceResponse = {
  eb: string;
  tb: string;
  m: string;
  n: string;
  c: string;
  v: string;
  e: string;
  mf: string;
  ml?: string;
};

export interface TradeBalanceParams {
  aclass?: AssetType;
  asset?: string;
}

export const tradeBalance = async (
  auth: Authentication,
  params?: TradeBalanceParams,
): Promise<TradeBalanceResponse> => {
  const response = (await privateRequest('TradeBalance', auth, params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
