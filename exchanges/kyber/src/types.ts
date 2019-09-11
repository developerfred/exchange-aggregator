import { Eth } from 'web3-eth';
import { Contract } from 'web3-eth-contract';

export type Network = 'mainnet' | 'kovan';

export interface Addresses {
  KyberNetworkProxy?: string;
}

export type ContractFactory = (name: string) => Contract;

export interface Environment {
  eth: Eth;
  addresses: Addresses;
  contract: ContractFactory;
}
