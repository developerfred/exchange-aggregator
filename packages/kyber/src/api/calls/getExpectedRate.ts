import BN from 'bn.js';
import { toWei } from 'web3-utils';
import { Environment } from '../../types';

export interface GetExpectedRateParams {
  srcToken: string;
  destToken: string;
  srcQty: string;
}

export interface GetExpectedRateResponse {
  expectedRate: BN;
  slippageRate: BN;
}

export const getExpectedRate = async (
  env: Environment,
  params: GetExpectedRateParams,
): Promise<GetExpectedRateResponse> => {
  const qty = toWei(params.srcQty);
  const contract = env.contract('KyberNetworkProxy');
  const method = contract.methods.getExpectedRate(
    params.srcToken,
    params.destToken,
    qty,
  );

  const output = await method.call();
  return {
    expectedRate: output.expectedRate,
    slippageRate: output.slippageRate,
  };
};
