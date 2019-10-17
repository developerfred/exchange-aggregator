import { ContractSendMethod } from 'web3-eth-contract';
import { Environment } from '../';

export const estimateGas = async (environment: Environment, method: ContractSendMethod, account?: string) => {
  const latestBlock = await environment.client.getBlock('latest');
  const estimation = await method.estimateGas(account && { from: account || environment.account });
  return Math.min(estimation + 300000, latestBlock.gasLimit);
};
