import { privateRequest } from '../common';
import { balancesResponse, Authentication } from '../types';

export const balances = async (auth: Authentication): Promise<balancesResponse> => {
  const response = (await privateRequest('get', `account/balances`, auth)).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as balancesResponse;
};
