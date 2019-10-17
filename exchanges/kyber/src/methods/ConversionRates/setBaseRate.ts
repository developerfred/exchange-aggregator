import * as R from 'ramda';
import BigNumber from 'bignumber.js';
import { TransactionReceipt } from 'web3-core';
import { Environment } from '../../';
import { sendTransaction } from '../../utils/sendTransaction';
import { bytesToHex } from '../../utils/bytesToHex';
import { sameAddress } from '../../utils/sameAddress';
import { log } from '../../debug';
import { getListedTokens } from './getListedTokens';
import { getBasicRate } from './getBasicRate';
import { getCompactData } from './getCompactData';

export interface BaseRateData {
  tokens: string[];
  baseBuy: string[];
  baseSell: string[];
  buy: number[][];
  sell: number[][];
  indices: number[];
}

interface Rates {
  [key: string]: {
    buy: BigNumber;
    sell: BigNumber;
  };
}

export const buildArguments = async (environment: Environment, rates: Rates) => {
  const listed = await getListedTokens(environment);
  const indices = R.range(0, Math.ceil(listed.length / 14));

  const keys = Object.keys(rates);
  const updates = listed.map(address => {
    const index = keys.findIndex(key => sameAddress(address, key));
    return rates[keys[index]];
  });

  // Fetch the current base rates and adjustments and the block number
  // in preparation for building the arguments. The current values for
  // the rate adjustments will be filled in as the default values.
  const block = await environment.client.getBlockNumber();
  const current = await Promise.all(
    listed.map(async address => {
      const result = await Promise.all([
        getBasicRate(environment, address, true),
        getBasicRate(environment, address, false),
        getCompactData(environment, address),
      ]);

      const base = { buy: result[0], sell: result[1] };
      const adjustment = { buy: result[2].buy, sell: result[2].sell };
      return { base, adjustment };
    }),
  );

  const base = {
    tokens: [] as string[],
    buy: [] as string[],
    sell: [] as string[],
  };

  const range = R.range(0, indices.length * 14);
  const adjustment = {
    buy: range.map(index => (current[index] ? current[index].adjustment.buy.toNumber() : 0)),
    sell: range.map(index => (current[index] ? current[index].adjustment.sell.toNumber() : 0)),
  };

  listed.forEach((address, index) => {
    const now = current[index];
    const update = updates[index];

    if (!update) {
      // If there was no update provided for the current address then
      // we can just re-use the previous adjustment values that were
      // already pre-fetched and inserted as a default value.
      return;
    }

    const buy = updates[index].buy
      .minus(now.base.buy)
      .multipliedBy(1000)
      .dividedBy(now.base.buy.isZero() ? 1 : now.base.buy);

    const sell = updates[index].sell
      .minus(now.base.sell)
      .multipliedBy(1000)
      .dividedBy(now.base.sell.isZero() ? 1 : now.base.sell);

    // If the rate changes are bigger than a certain threshold, we have to
    // set a new base rate. In that case, the bps has to be reset to 0.
    if (buy.isLessThan(-128) || buy.isGreaterThan(127) || sell.isLessThan(-128) || sell.isGreaterThan(127)) {
      adjustment.buy[index] = 0;
      adjustment.sell[index] = 0;

      base.tokens.push(address);
      base.buy.push(updates[index].buy.toFixed());
      base.sell.push(updates[index].sell.toFixed());
    } else {
      adjustment.buy[index] = Math.floor(buy.toNumber());
      adjustment.buy[index] = Math.floor(buy.toNumber());
    }
  });

  const buy = R.splitEvery(14, adjustment.buy).map(group => bytesToHex(group));
  const sell = R.splitEvery(14, adjustment.sell).map(group => bytesToHex(group));
  return [base.tokens, base.buy, base.sell, buy, sell, block, indices];
};

export const setBaseRate = async (environment: Environment, rates: Rates): Promise<TransactionReceipt> => {
  log('Setting base rates.');

  const args = await buildArguments(environment, rates);
  return sendTransaction(
    environment,
    {
      contract: 'ConversionRates',
      method: 'setBaseRate',
    },
    undefined,
    args,
  );
};
