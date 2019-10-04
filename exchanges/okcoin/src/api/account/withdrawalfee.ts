import { Authentication, CallLimit, WithdrawalFeeResponse } from '../types';
import { apiRequest } from '../common';

export const withdrawalfee = async (auth: Authentication, currency?: string): Promise<WithdrawalFeeResponse[]> => {
  const limit = {
    limit: 0,
    frequency: 0,
    period: 'NONE',
  } as CallLimit;

  const response = (await apiRequest(auth, limit, 'get', `/api/account/v3/withdrawal/fee`, currency)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as WithdrawalFeeResponse[];
};
