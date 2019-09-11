import { publicRequest } from '../common';
import { SellOrBuyAbbreviated, MarketOrLimitAbbreviated } from '../types';

export interface TradesParams {
  pair: string;
  since?: number;
}

export type TradesResponse = {
  [key: string]: [string, string, number, SellOrBuyAbbreviated, MarketOrLimitAbbreviated, string][];
} & {
  last: number;
};

export const trades = async (params: TradesParams): Promise<TradesResponse> => {
  const response = (await publicRequest('Trades', params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
