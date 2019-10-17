import BigNumber from 'bignumber.js';
import { Environment } from '../..';
import { makeCall } from '../../utils/makeCall';

export const getBasicRate = async (
  environment: Environment,
  token: string,
  buy: boolean = true,
): Promise<BigNumber> => {
  const result = await makeCall(
    environment,
    {
      contract: 'ConversionRates',
      method: 'getBasicRate',
    },
    [token, buy],
  );

  return result && new BigNumber(result.toString());
};
