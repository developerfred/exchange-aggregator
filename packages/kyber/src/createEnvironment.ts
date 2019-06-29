import { Eth } from 'web3-eth/types';
import { Contract } from 'web3-eth-contract/types';
import { Addresses, ContractName, Environment } from './types';

export type CustomContractFactory = (eth: Eth, name: string, address: string) => Contract;

export interface CreateEnvironmentOptions {
  eth: Eth;
  addresses: Addresses;
  factory?: CustomContractFactory;
}

const defaultFactory: CustomContractFactory = (eth, name, address) => {
  const abi = require(`./abi/${name}.abi.json`);
  return new eth.Contract(abi, address);
};

export const createEnvironment = (options: CreateEnvironmentOptions): Environment => {
  const factory = (name: ContractName) => {
    const fn = options.factory || defaultFactory;
    const address = options.addresses[name];
    if (!address) {
      throw new Error(`Missing address for ${name} contract.`);
    }

    return fn(options.eth, name, address);
  };

  return {
    eth: options.eth,
    addresses: options.addresses,
    contract: factory,
  };
};
