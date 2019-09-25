import { privateRequest } from '../common';
import { Authentication, WithdrawalCryptoParams, WithdrawalCryptoResponse } from '../types';

// TODO: TO TEST
export const withdrawalcrypto = async (
  auth: Authentication,
  data: WithdrawalCryptoParams,
): Promise<WithdrawalCryptoResponse> => {
  // Initiates a withdrawal
  const response = (await privateRequest('post', `account/withdraw/crypto`, auth, {}, data)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as WithdrawalCryptoResponse;
};
