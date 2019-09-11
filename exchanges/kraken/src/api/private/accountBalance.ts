import { privateRequest } from '../common';
import { Authentication } from '../types';

export interface AccountBalanceResponse {
  [key: string]: string;
}

export const accountBalance = async (auth: Authentication): Promise<AccountBalanceResponse> => {
  const response = (await privateRequest('Balance', auth)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
