import { Authentication, CallLimit } from '../types';
import { apiRequest } from '../common';

// TODO: interface
// TODO: test with currency

export const withdrawalhistory = async (auth: Authentication, currency?: string): Promise<any> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const endpoint = currency ? `/api/account/v3/withdrawal/history/${currency}` : `/api/account/v3/withdrawal/history`;
  const response = (await apiRequest(auth, limit, 'get', endpoint)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as any;
};
