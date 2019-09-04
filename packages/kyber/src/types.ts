import { Eth } from 'web3-eth/types';
import { Contract } from 'web3-eth-contract/types';

export type Network = 'mainnet' | 'kovan';

export type ContractName = 'KyberNetworkProxy';

export interface Addresses {
  KyberNetworkProxy?: string;
}

export type ContractFactory = (name: string) => Contract;

export interface Environment {
  eth: Eth;
  addresses: Addresses;
  contract: ContractFactory;
}
