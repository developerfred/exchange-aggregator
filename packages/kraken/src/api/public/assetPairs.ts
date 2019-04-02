import { publicRequest } from '../common';
import { AssetPairInfo } from '../types';

export interface AssetPairsParams {
  info?: 'info' | 'leverage' | 'fees' | 'margin';
  pair?: string[];
}

export interface AssetPairsResponse {
  [key: string]: AssetPairInfo;
}

export const assetPairs = async (
  params?: AssetPairsParams,
): Promise<AssetPairsResponse> => {
  const args = {
    ...params,
    ...(params && params.pair && { pair: params.pair.join(',') }),
  };

  const response = (await publicRequest('AssetPairs', args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
