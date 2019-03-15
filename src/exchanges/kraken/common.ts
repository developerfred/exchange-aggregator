import crypto from 'crypto';
import qs from 'qs';
import axios from 'axios';
import { Network } from '../../types';
import { Kraken } from './types';

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

export const getHttpPrefix = (network: Network) => {
  switch (network) {
    case Network.MAINNET:
      return 'https://api.kraken.com';
    default:
      throw new Error('Kraken only supports the MAINNET network.');
  }
};

const prefix = 'https://api.kraken.com';
export const privateRequest = async (
  method: string,
  params: any = {},
  auth: Kraken.Authentication,
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
    const response = await axios.post(`${prefix}${path}`, data, {
      headers: {
        'API-Key': key,
        'API-Sign': signature,
      },
    });

    return response;
  } catch (e) {
    const error = new Error('Failed to execute request on exchange.');
    (error as any).original = e;
    throw error;
  }
};
