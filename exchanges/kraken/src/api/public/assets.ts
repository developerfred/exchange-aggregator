import { publicRequest } from '../common';
import { AssetType } from '../types';

export interface AssetParams {
  info?: 'info';
  aclass?: AssetType;
  asset?: string[];
}

export interface AssetsResponse {
  unixtime: number;
  rfc1123: string;
}

export const assets = async (params: AssetParams): Promise<AssetsResponse> => {
  const args = {
    ...params,
    ...(params && params.asset && { pair: params.asset.join(',') }),
  };

  const response = (await publicRequest('Assets', args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
