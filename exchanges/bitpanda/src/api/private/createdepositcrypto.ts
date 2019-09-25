import { privateRequest } from '../common';
import { Authentication, CreateDepositCryptoResponse } from '../types';

// TODO: TO TEST
export const createdepositcrypto = async (
  auth: Authentication,
  currency: string,
): Promise<CreateDepositCryptoResponse> => {
  // Creates a new deposit address for the given currency code
  const response = (await privateRequest('post', `account/deposit/crypto`, auth, {}, currency)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as CreateDepositCryptoResponse;
};
