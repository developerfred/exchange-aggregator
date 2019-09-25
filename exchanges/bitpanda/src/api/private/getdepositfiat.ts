import { privateRequest } from '../common';
import { Authentication, GetDepositFiatResponse } from '../types';

// TODO: TO TEST
export const getdepositfiat = async (auth: Authentication): Promise<GetDepositFiatResponse> => {
  // Returns deposit information for sepa payments.
  const response = (await privateRequest('get', `account/deposit/fiat/EUR`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as GetDepositFiatResponse;
};
