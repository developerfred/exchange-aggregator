import { Authentication, CallLimit, LedgerParams, LedgerResponse } from '../types';
import { apiRequest } from '../common';

export const ledger = async (auth: Authentication, params?: LedgerParams): Promise<LedgerResponse[]> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/account/v3/ledger`, params)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as LedgerResponse[];
};
