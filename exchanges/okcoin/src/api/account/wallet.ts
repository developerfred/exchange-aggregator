import { Authentication, CallLimit, WalletResponse } from '../types';
import { apiRequest } from '../common';

export const wallet = async (auth: Authentication): Promise<WalletResponse[]> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/account/v3/wallet`)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as WalletResponse[];
};
