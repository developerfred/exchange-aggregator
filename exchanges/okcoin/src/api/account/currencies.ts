import { Authentication, CallLimit, CurrenciesResponse } from '../types';
import { apiRequest } from '../common';

export const currencies = async (auth: Authentication): Promise<CurrenciesResponse[]> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/account/v3/currencies`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as CurrenciesResponse[];
};
