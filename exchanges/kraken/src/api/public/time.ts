import { publicRequest } from '../common';

export interface TimeResponse {
  unixtime: number;
  rfc1123: string;
}

export const time = async (): Promise<TimeResponse> => {
  const response = (await publicRequest('Time')).data;
  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response.result;
};
