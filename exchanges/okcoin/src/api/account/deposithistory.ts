import { Authentication, CallLimit, DepositHistoryResponse } from '../types';
import { apiRequest } from '../common';

// TODO: test

export const deposithistory = async (auth: Authentication, currency?: string): Promise<DepositHistoryResponse[]> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const endpoint = currency ? `/api/account/v3/deposit/history/${currency}` : `/api/account/v3/deposit/history`;
  const response = (await apiRequest(auth, limit, 'get', endpoint)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as DepositHistoryResponse[];
};
