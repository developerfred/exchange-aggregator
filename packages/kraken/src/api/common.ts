import crypto from 'crypto';
import qs from 'qs';
import axios from 'axios';
import { Authentication } from './types';

export const generateSignature = (
  data: any,
  path: string,
  secret: string,
  nonce: any,
) => {
  const secretBuffer = new Buffer(secret, 'base64');
  const hash = crypto.createHash('sha256');
  const hmac = crypto.createHmac('sha512', secretBuffer);
  const hashDigest = hash.update(nonce + data).digest('binary' as any);
  const hmacDigest = hmac
    .update(path + hashDigest, 'binary' as any)
    .digest('base64');

  return hmacDigest;
};

const prefix = 'https://api.kraken.com';

export const publicRequest = async (method: string, params: any = {}) => {
  const path = `/0/public/${method}`;

  try {
    return axios.get(`${prefix}${path}`, { params });
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};

export const privateRequest = async (
  method: string,
  auth: Authentication,
  params: any = {},
) => {
  const path = `/0/private/${method}`;
  const nonce = Date.now() * 1000;
  const data = qs.stringify({
    nonce,
    ...params,
  });

  const key = auth.key;
  const secret = auth.secret;
  const signature = generateSignature(data, path, secret, nonce);

  try {
    return axios.post(`${prefix}${path}`, data, {
      headers: {
        'API-Key': key,
        'API-Sign': signature,
      },
    });
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};
