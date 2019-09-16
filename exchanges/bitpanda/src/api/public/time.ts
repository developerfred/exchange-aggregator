import { publicRequest } from '../common';
import { TimeResponse } from '../types';

export const time = async (): Promise<TimeResponse> => {
  const response = (await publicRequest('get', 'time/')).data;

  if (response.error && !!response.error.length) {
    throw new Error(response.error);
  }

  return response as TimeResponse;
};
