import BigNumber from 'bignumber.js';
import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';

export const getRate = async (environment: Environment, token: string, qty: BigNumber, buy: boolean = true) => {
  const block = await environment.client.getBlockNumber();
  const args = [token, block, buy, qty.toFixed()];
  const result = await makeCall(
    environment,
    {
      contract: 'ConversionRates',
      method: 'getRate',
    },
    args,
  );

  return result && new BigNumber(result.toString());
};
