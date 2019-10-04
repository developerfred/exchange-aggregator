import { Authentication, CallLimit, DepositAddressResponse } from '../types';
import { apiRequest } from '../common';

export const depositaddress = async (auth: Authentication, currency: string): Promise<DepositAddressResponse[]> => {
  const limit = {
    limit: 20,
    frequency: 2,
    period: 'SECOND',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/account/v3/deposit/address`, { currency: currency }))
    .data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as DepositAddressResponse[];
};
