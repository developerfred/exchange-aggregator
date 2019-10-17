import * as R from 'ramda';
import BigNumber from 'bignumber.js';
import { Environment } from '../../';
import { makeCall } from '../../utils/makeCall';
import { StepFunctionData } from './setQtyStepFunction';

export const getImbalanceStepFunction = async (environment: Environment, token: string) => {
  const config = {
    contract: 'ConversionRates',
    method: 'getStepFunctionData',
  };

  const lengths = await Promise.all([
    makeCall(environment, config, [token, 0, 0]),
    makeCall(environment, config, [token, 4, 0]),
  ]);

  const bRange = R.range(0, parseInt(lengths[0].toString(), 10));
  const sRange = R.range(0, parseInt(lengths[1].toString(), 10));

  const xBuyPromises = Promise.all(bRange.map(index => makeCall(environment, config, [token, 1, index])));

  const yBuyPromises = Promise.all(bRange.map(index => makeCall(environment, config, [token, 3, index])));

  const xSellPromises = Promise.all(sRange.map(index => makeCall(environment, config, [token, 5, index])));

  const ySellPromises = Promise.all(sRange.map(index => makeCall(environment, config, [token, 7, index])));

  const [xBuy, yBuy, xSell, ySell] = (await Promise.all([
    xBuyPromises,
    yBuyPromises,
    xSellPromises,
    ySellPromises,
  ])).map(data => data.map(item => new BigNumber(item.toString())));

  return { xBuy, yBuy, xSell, ySell } as StepFunctionData;
};
