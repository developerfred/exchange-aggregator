import { publicRequest } from '../common';

export interface SpreadParams {
  pair: string;
  since?: number;
}

export type SpreadResponse = {
  [key: string]: [number, string, string][];
} & {
  last: number;
};

export const spread = async (params: SpreadParams): Promise<SpreadResponse> => {
  const response = (await publicRequest('Spread', params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
