import { privateRequest } from '../common';
import { BalancesResponse, Authentication } from '../types';

export const balances = async (auth: Authentication): Promise<BalancesResponse> => {
  const response = (await privateRequest('get', `account/balances`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as BalancesResponse;
};
