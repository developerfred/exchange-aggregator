import { privateRequest } from '../common';
import { Authentication } from '../types';

export interface FeesInfo {
  fee: string;
  minfee: string;
  maxfee: string;
  nextfee: string;
  nextvolume: string;
  tiervolume: string;
}

export interface TradeVolumeResponse {
  currency: string;
  volume: string;
  fees?: {
    [key: string]: FeesInfo;
  };
  fees_maker?: {
    [key: string]: FeesInfo;
  };
}

export interface TradeVolumeParams {
  pair?: string[];
  feeInfo?: boolean;
}

export const tradeVolume = async (auth: Authentication, params?: TradeVolumeParams): Promise<TradeVolumeResponse> => {
  const args = {
    ...(params &&
      typeof params.feeInfo !== undefined && {
        'fee-info': params.feeInfo,
      }),
    ...(params && params.pair && { pair: params.pair.join(',') }),
  };

  const response = (await privateRequest('TradeVolume', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
