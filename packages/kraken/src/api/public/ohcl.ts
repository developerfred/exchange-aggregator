import { publicRequest } from '../common';

export interface OhclParams {
  interval?: 1 | 5 | 15 | 30 | 60 | 240 | 1440 | 10080 | 21600;
  since?: number;
  pair: string[];
}

export type OhclResponse = {
  [key: string]: [
    number,
    string,
    string,
    string,
    string,
    string,
    string,
    number
  ][];
} & {
  last: number;
};

export const ohcl = async (params?: OhclParams): Promise<OhclResponse> => {
  const args = {
    ...params,
    pair: params.pair.join(','),
  };

  const response = (await publicRequest('OHCL', args)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
