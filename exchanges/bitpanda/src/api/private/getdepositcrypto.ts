import { privateRequest } from '../common';
import { Authentication, GetDepositCryptoResponse } from '../types';

// TODO: TO TEST
export const getdepositcrypto = async (
  auth: Authentication,
  currency_code: string,
): Promise<GetDepositCryptoResponse> => {
  // Returns a deposit address for the given crypto currency code
  const response = (await privateRequest('get', `account/deposit/crypto/${currency_code}`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as GetDepositCryptoResponse;
};
