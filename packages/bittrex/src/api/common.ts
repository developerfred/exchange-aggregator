import crypto from 'crypto';
import qs from 'qs';
import axios from 'axios';

export interface Authentication {
  key: string;
  secret: string;
}

export const generateSignature = (path: string, secret: string) => {
  return crypto
    .createHmac('sha512', secret)
    .update(path)
    .digest('hex');
};

const prefix = 'https://api.bittrex.com/api/v1.1';

export interface BittrexResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

export const publicRequest = async <T>(
  method: string,
  params: any = {},
): Promise<BittrexResponse<T>> => {
  const path = `/${method}`;

  try {
    const response = await axios.get(`${prefix}${path}`, { params });
    return response.data;
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};

export const privateRequest = async <T>(
  method: string,
  auth: Authentication,
  params: any = {},
): Promise<BittrexResponse<T>> => {
  const path = `${prefix}/${method}`;
  const nonce = Date.now() * 1000;
  const query = qs.stringify({
    ...params,
    nonce,
    apiKey: auth.key,
  });

  const message = `${path}?${query}`;
  const signature = generateSignature(message, auth.secret);

  try {
    const response = await axios.get(message, {
      headers: {
        apisign: signature,
      },
    });

    return response.data;
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};
