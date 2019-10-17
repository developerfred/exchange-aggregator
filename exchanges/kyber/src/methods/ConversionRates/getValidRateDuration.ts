import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const getValidRateDuration = async (environment: Environment) => {
  const result = await makeCall<BN>(environment, {
    contract: 'ConversionRates',
    method: 'validRateDurationInBlocks',
  });

  return result && new BigNumber(result.toString());
};
