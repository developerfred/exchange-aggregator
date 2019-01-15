import { watch as watchKraken, fetch as fetchKraken } from './kraken';

import { watch as watchEthfinex, fetch as fetchEthfinex } from './ethfinex';

import { watch as watchKyber, fetch as fetchKyber } from './kyber';

import { watch as watchOasisDex, fetch as fetchOasisDex } from './oasisdex';

import {
  watch as watchRadarRelay,
  fetch as fetchRadarRelay,
} from './radarrelay';

export const ethfinex = {
  watch: watchEthfinex,
  fetch: fetchEthfinex,
};

export const kraken = {
  watch: watchKraken,
  fetch: fetchKraken,
};

export const oasisdex = {
  watch: watchOasisDex,
  fetch: fetchOasisDex,
};

export const radarrelay = {
  watch: watchRadarRelay,
  fetch: fetchRadarRelay,
};

export const kyber = {
  watch: watchKyber,
  fetch: fetchKyber,
};
