import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { Environment } from '../..';
import { makeCall } from '../../utils/makeCall';

export const getTokenControlInfo = async (env: Environment, token: string) => {
  const result = await makeCall<{
    0: BN;
    1: BN;
    2: BN;
  }>(
    env,
    {
      contract: 'ConversionRates',
      method: 'getTokenControlInfo',
    },
    [token],
  );

  const minimalRecordResolution = new BigNumber(result[0] ? result[0].toString() : 0);
  const maxPerBlockImbalance = new BigNumber(result[1] ? result[1].toString() : 0);
  const maxTotalImbalance = new BigNumber(result[2] ? result[2].toString() : 0);

  return {
    minimalRecordResolution,
    maxPerBlockImbalance,
    maxTotalImbalance,
  };
};
