import { privateRequest } from '../common';
import { AssetType, LedgerType, LedgerInfo, Authentication } from '../types';

export interface LedgersResponse {
  [key: string]: LedgerInfo;
}

export interface LedgersParams {
  aclass?: AssetType;
  asset?: string[];
  type?: LedgerType;
  start?: number;
  end?: number;
  ofs?: number;
}

export const ledgers = async (
  auth: Authentication,
  params?: LedgersParams,
): Promise<LedgersResponse> => {
  const args = {
    ...params,
    ...(params && params.asset && { asset: params.asset.join(',') }),
  };

  const response = (await privateRequest('Ledgers', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
