import { Authentication, CallLimit } from '../types';
import { apiRequest } from '../common';

// TODO: test

export enum AccountParams {
  'sub account' = 0,
  'spot' = 1,
  'margin' = 5,
  'wallet' = 6,
  'PiggyBank' = 8,
}

export interface TransferParams {
  amount: number;
  currency: string;
  from: AccountParams;
  to: AccountParams;
  sub_account?: string;
  instrument_id?: string;
  to_instrument_id?: string;
}

export const transfer = async (auth: Authentication, params: TransferParams): Promise<any> => {
  const limit = {
    limit: 1,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'post', `/api/account/v3/transfer`, params)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
