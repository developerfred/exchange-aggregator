import { privateRequest } from '../common';
import { LedgerInfo, Authentication } from '../types';

export interface QueryLedgersResponse {
  [key: string]: LedgerInfo;
}

export interface QueryLedgersParams {
  id: string[];
}

export const queryLedgers = async (auth: Authentication, params: QueryLedgersParams): Promise<QueryLedgersResponse> => {
  const args = {
    ...params,
    ...(params.id && { id: params.id.join(',') }),
  };

  const response = (await privateRequest('QueryLedgers', auth, args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
