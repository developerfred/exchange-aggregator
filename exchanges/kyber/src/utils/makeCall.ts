import { Environment } from '../';
import { getContract } from './getContract';
import { Contract } from 'web3-eth-contract';

export interface CallConfig {
  contract: Contract | string;
  method: string;
  address?: string;
  block?: number;
}

export const makeCall = async <T>(environment: Environment, config: CallConfig, args?: any[]): Promise<T> => {
  const contract = config.contract;
  const address = config.address;
  const method = config.method;
  const block = config.block;
  const instance = typeof contract === 'string' ? getContract(environment, contract, address) : contract;
  return instance.methods[method](...(args || [])).call(undefined, block);
};
