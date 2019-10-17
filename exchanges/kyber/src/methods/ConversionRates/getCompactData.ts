import BigNumber from 'bignumber.js';
import { toBN } from 'web3-utils';
import { Environment } from '../..';
import { makeCall } from '../../utils/makeCall';

export const getCompactData = async (environment: Environment, token: string) => {
  const result = await makeCall<{
    0: any; // BN
    1: any; // BN
    2: string;
    3: string;
  }>(
    environment,
    {
      contract: 'ConversionRates',
      method: 'getCompactData',
    },
    [token],
  );

  const arrayIndex = new BigNumber(result[0].toString());
  const fieldOffset = new BigNumber(result[1].toString());
  const buy = new BigNumber(toBN(result[2]).toString());
  const sell = new BigNumber(toBN(result[3]).toString());

  return {
    arrayIndex,
    fieldOffset,
    buy,
    sell,
  };
};
