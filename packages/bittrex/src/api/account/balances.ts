import { privateRequest, Authentication } from '../common';

export interface Balance {
  Currency: string;
  Balance: number;
  Available: number;
  Pending: number;
  CryptoAddress: string;
  Requested: boolean;
  Uuid: string;
}

export type GetBalancesResult = Balance[];

export const balances = async (auth: Authentication) => {
  const method = 'account/getbalances';
  const response = await privateRequest<GetBalancesResult>(method, auth);
  if (!response.success) {
    throw new Error(response.message);
  }

  return response.result;
};
