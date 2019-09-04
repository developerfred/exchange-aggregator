import BigNumber from 'bignumber.js';
import { toWei, fromWei } from 'web3-utils';
import { Environment } from '../../types';

export interface GetUniswapRateParams {
  targetExchange: string;
  nativeAsset?: string;
  makerAsset: string;
  takerAsset: string;
  takerQuantity: BigNumber | number | string;
  takerDecimals: number;
}

export type GetUniswapRateResponse = BigNumber;

export const getUniswapRate = async (
  env: Environment,
  params: GetUniswapRateParams,
): Promise<GetUniswapRateResponse> => {
  const qty = toWei(params.takerQuantity.toString());
  const contract = env.contract('UniswapAdapter');
  const method = contract.methods.getInputPrice(
    params.targetExchange,
    params.nativeAsset,
    params.makerAsset,
    params.takerAsset,
    qty,
  );

  const output = new BigNumber((await method.call()).toString());
  const rate = output.multipliedBy(new BigNumber(10).pow(params.takerDecimals)).dividedBy(qty);
  return new BigNumber(fromWei(rate.toString()));
};
