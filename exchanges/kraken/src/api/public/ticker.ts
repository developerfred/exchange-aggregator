import { publicRequest } from '../common';
import { TickerInfo } from '../types';

export interface TickerParams {
  pair: string[];
}

export interface TickerResponse {
  [key: string]: TickerInfo;
}

export const ticker = async (params: TickerParams): Promise<TickerResponse> => {
  const args = {
    ...params,
    pair: params.pair.join(','),
  };

  const response = (await publicRequest('Ticker', args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
