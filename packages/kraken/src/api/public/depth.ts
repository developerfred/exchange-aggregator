import { publicRequest } from '../common';

export interface DepthParams {
  pair: string;
  count?: number;
}

export interface DepthResponse {
  [key: string]: {
    asks: [string, string, string];
    bids: [string, string, string];
  };
}

export const depth = async (params: DepthParams): Promise<DepthResponse> => {
  const response = (await publicRequest('Depth', params)).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
