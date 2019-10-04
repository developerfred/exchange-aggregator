import { Authentication, CallLimit } from '../types';
import { apiRequest } from '../common';

// TODO: test

export enum DestinationParams {
  'OKCoin' = 2,
  'OKEx' = 3,
  'other addresses' = 4,
}

export interface WithdrawalParams {
  amount: number;
  fee: number;
  trade_pwd: string;
  destination: DestinationParams;
  currency: string;
  to_address: string;
}

export const withdrawal = async (auth: Authentication, params: WithdrawalParams): Promise<any> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'post', `/api/account/v3/withdrawal`, params)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
