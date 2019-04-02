import { privateRequest } from '../common';
import { TradeInfo, Authentication } from '../types';

export interface TradesHistoryResponse {
  trades: {
    [key: string]: TradeInfo;
  };
  count: number;
}

export type TradesHistoryType =
  | 'all'
  | 'any position'
  | 'closed position'
  | 'closing position'
  | 'no position';

export interface TradesHistoryParams {
  type?: TradesHistoryType;
  trades?: boolean;
  start?: number;
  end?: number;
  ofs?: number;
}

export const tradesHistory = async (
  auth: Authentication,
  params: TradesHistoryParams,
): Promise<TradesHistoryResponse> => {
  const response = (await privateRequest('TradesHistory', auth, params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
