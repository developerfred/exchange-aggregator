import BigNumber from 'bignumber.js';
import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const getBalance = async (environment: Environment, token: string): Promise<BigNumber> => {
  const result = await makeCall(
    environment,
    {
      contract: 'KyberReserve',
      method: 'getBalance',
    },
    [token],
  );

  return result ? new BigNumber(result.toString()) : new BigNumber(0);
};
