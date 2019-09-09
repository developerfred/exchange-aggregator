import BigNumber from 'bignumber.js';
import { Environment } from '../../types';
import { Token } from '@melonproject/ea-common/lib/types';

export interface GetUniswapRateParams {
  targetExchange: string;
  nativeAsset?: Token;
  makerAsset: Token;
  takerAsset: Token;
  takerQuantity: BigNumber | number | string;
}

export type GetUniswapRateResponse = BigNumber;

export const getUniswapRate = async (
  env: Environment,
  params: GetUniswapRateParams,
): Promise<GetUniswapRateResponse> => {
  const takerQuantity = new BigNumber(params.takerQuantity).multipliedBy(10 ** params.takerAsset.decimals);
  const contract = env.contract('UniswapAdapter');
  const nativeAssetAddress = params.nativeAsset ? params.nativeAsset.address : env.addresses.Weth;
  const method = contract.methods.getInputRate(
    params.targetExchange,
    nativeAssetAddress,
    params.takerAsset.address,
    takerQuantity.toString(),
    params.makerAsset.address,
  );

  const output = new BigNumber((await method.call()).toString());
  return output.dividedBy(10 ** params.makerAsset.decimals);
};
