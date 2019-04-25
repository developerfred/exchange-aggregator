import BigNumber from 'bignumber.js';
import { toWei, fromWei } from 'web3-utils';
import { Environment } from '../../types';

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
  params: GetExpectedRateParams,
): Promise<GetExpectedRateResponse> => {
  const qty = toWei(params.srcQty.toString());
  const contract = env.contract('KyberNetworkProxy');
  const method = contract.methods.getExpectedRate(
    params.srcToken,
    params.destToken,
    qty,
  );

  const output = await method.call();
  const expectedRate = fromWei(output.expectedRate.toString());
  const slippageRate = fromWei(output.slippageRate.toString());

  return {
    expectedRate: new BigNumber(expectedRate),
    slippageRate: new BigNumber(slippageRate),
  };
};
