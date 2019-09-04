import { privateRequest } from '../common';
import { SellOrBuy, OrderType, Authentication } from '../types';

export interface PositionInfo {
  pair: string;
  time: number;
  type: SellOrBuy;
  ordertype: OrderType;
  cost: string;
  fee: string;
  vol: string;
  vol_closed: string;
  margin: string;
  value: string;
  net: string;
  misc: string;
  oflags: string;
  viqc: string;
}

export interface OpenPositionsResponse {
  [key: string]: PositionInfo;
}

export interface OpenPositionsParams {
  txid: string[];
  docalcs?: boolean;
}

export const openPositions = async (
  auth: Authentication,
  params: OpenPositionsParams,
): Promise<OpenPositionsResponse> => {
  const args = {
    ...params,
    ...(params.txid && { txid: params.txid.join(',') }),
  };

  const response = (await privateRequest('OpenPositions', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
