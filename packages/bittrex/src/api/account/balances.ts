import { privateRequest, Authentication, HttpMethod } from '../common';

export interface Balance {
  currencySymbol: string;
  total: number;
  available: number;
}

export type GetBalancesResult = Balance[];

export const balances = async (auth: Authentication) => {
  const path = 'balances';
  const response = await privateRequest<GetBalancesResult>(
    path,
    auth,
    undefined,
    HttpMethod.GET,
  );

  return response;
};
