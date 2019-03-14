import crypto from 'crypto';
import { Network } from '../../types';

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
