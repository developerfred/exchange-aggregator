import { privateRequest } from '../common';
import { TradeInfo, Authentication } from '../types';

export interface QueryTradesResponse {
  trades: {
    [key: string]: TradeInfo;
  };
  count: number;
}

export interface QueryTradesParams {
  txid: string[];
  trades?: boolean;
}

export const queryTrades = async (auth: Authentication, params: QueryTradesParams): Promise<QueryTradesResponse> => {
  const args = {
    ...params,
    ...(params.txid && { txid: params.txid.join(',') }),
  };

  const response = (await privateRequest('QueryTrades', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
