import { getUniswapRate } from '../../api/calls/getUniswapRate';
import { observeOrderbook } from './index'
import { Eth } from 'web3-eth';
import { createEnvironment, addresses } from '../../index';
import BigNumber from 'bignumber.js';
import { Token, OrderbookUpdate } from '@melonproject/ea-common';
import { take } from 'rxjs/operators';
import * as dotenv from "dotenv";

dotenv.config();

describe('getUniswapRate', () => {
  it('should properly handle the returned values', async () => {

    const eth = await new Eth(process.env.JSON_RPC_ENDPOINT);
    const env = await createEnvironment({ eth, addresses });
    
    const weth: Token = {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
      symbol: 'WETH'
    };

    const dgx: Token = {
      address: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
      decimals: 9,
      symbol: 'DGX'
    }

    const dgxRate = await getUniswapRate(env, {
      makerAsset: dgx,
      takerAsset: weth,
      nativeAsset: weth,
      takerQuantity: new BigNumber(1),
      targetExchange: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    });

    const ethRateInDgx = await getUniswapRate(env, {
      makerAsset: weth,
      takerAsset: dgx,
      nativeAsset: weth,
      takerQuantity: new BigNumber(1),
      targetExchange: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    });

    const obs = observeOrderbook([{ base: weth, quote: dgx }], { environment: env } );
    const firstOBResult: OrderbookUpdate = await new Promise((resolve, reject) => {
      return obs.pipe(take(1)).subscribe(resolve, reject)
    });

    expect(firstOBResult.bids[0].price).toStrictEqual(dgxRate);
    expect(firstOBResult.asks[0].price).toStrictEqual(new BigNumber(1).dividedBy(ethRateInDgx));
  });
});
