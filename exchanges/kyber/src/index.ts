import { Eth } from 'web3-eth';
import * as abstract from './abstract';

export { abstract };

export interface Environment {
  client: Eth;
  deployment: Deployment;
  account?: string;
}

export interface Deployment {
  KyberNetworkProxy: string;
  KyberNetwork: string;
  PermissionlessOrderbookReserveLister: string;
  KyberReserve: string;
  OrderbookReserve: string;
  ConversionRates: string;
  LiquidityConversionRates: string;
  ExpectedRate: string;
  FeeBurner: string;
  SanityRates: string;
  WhiteList: string;
  KyberNetworkENSResolver: string;
}
