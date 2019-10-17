import BigNumber from 'bignumber.js';
import { fromWei, toWei } from 'web3-utils';
import { Environment } from '../..';
import { makeCall } from '../../utils/makeCall';

export interface GetExpectedRateParams {
  srcToken: string;
  destToken: string;
  srcQty: BigNumber | string | number;
}

export interface GetExpectedRateResponse {
  expectedRate: BigNumber;
  slippageRate: BigNumber;
}

export const getExpectedRate = async (
  env: Environment,
  srcToken: string,
  destToken: string,
  srcQty: BigNumber,
): Promise<GetExpectedRateResponse> => {
  const result = await makeCall<{
    expectedRate: any; // BN
    slippageRate: any; // BN
  }>(
    env,
    {
      contract: 'KyberNetworkProxy',
      method: 'getExpectedRate',
    },
    [srcToken, destToken, toWei(srcQty.toFixed(18))],
  );

  const expectedRate = fromWei(result.expectedRate.toString());
  const slippageRate = fromWei(result.slippageRate.toString());

  return {
    expectedRate: new BigNumber(expectedRate),
    slippageRate: new BigNumber(slippageRate),
  };
};
