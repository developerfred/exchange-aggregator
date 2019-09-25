import { privateRequest } from '../common';
import { Authentication, WithdrawalFiatParams, WithdrawalFiatResponse } from '../types';

// TODO: TO TEST
export const withdrawalfiat = async (
  auth: Authentication,
  data: WithdrawalFiatParams,
): Promise<WithdrawalFiatResponse> => {
  // Initiates a withdrawal
  const response = (await privateRequest('post', `account/withdraw/fiat`, auth, {}, data)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as WithdrawalFiatResponse;
};
