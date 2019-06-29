import crypto from 'crypto';
import axios, { Method } from 'axios';

export interface Authentication {
  key: string;
  secret: string;
}

export const generateSignature = (path: string, secret: string, timestamp: number, method: Method, hash: string) => {
  const joined = [timestamp, path, method, hash].join('');
  return crypto
    .createHmac('sha512', secret)
    .update(joined)
    .digest('hex');
};

export const generateContentHash = (content: any = '') => {
  return crypto
    .createHash('sha512')
    .update(JSON.stringify(content))
    .digest('hex');
};

const prefix = 'https://api.bittrex.com/v3';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  TRACE = 'TRACE',
  OPTIONS = 'OPTIONS',
  CONNECT = 'CONNECT',
}

export const publicRequest = async <T>(path: string, params: any = {}): Promise<T> => {
  try {
    const response = await axios.get(`${prefix}/${path}`, { params });
    return response.data;
  } catch (e) {
    console.log(e);
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};

export const privateRequest = async <T>(
  path: string,
  auth: Authentication,
  params: any = {},
  method: Method = 'POST',
): Promise<T> => {
  const { secret, key } = auth;
  const url = `${prefix}/${path}`;
  const timestamp = new Date().getTime();
  const hash = generateContentHash(params);
  const signature = generateSignature(url, secret, timestamp, method, hash);

  try {
    const response = await axios.request({
      url,
      data: params,
      method,
      headers: {
        'Api-Key': key,
        'Api-Timestamp': timestamp,
        'Api-Content-Hash': hash,
        'Api-Signature': signature,
      },
    });

    return response.data;
  } catch (e) {
    console.log(e);
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};
