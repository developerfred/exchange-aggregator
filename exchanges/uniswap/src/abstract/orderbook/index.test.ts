import { getUniswapRate } from '../../api/calls/getUniswapRate';
import { observeOrderbook } from './index';
import { Eth } from 'web3-eth';
import { createEnvironment, addresses } from '../../index';
import BigNumber from 'bignumber.js';
import { Token, OrderbookUpdate } from '@melonproject/ea-common';
import { take } from 'rxjs/operators';

describe('observeOrderbook', () => {
  it('should produce the same values as a singular fetch', async () => {
    const eth = await new Eth(process.env.JSON_RPC_ENDPOINT);
    const env = await createEnvironment({ eth, addresses });

    const weth: Token = {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
      symbol: 'WETH',
    };

    const dgx: Token = {
      address: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
      decimals: 9,
      symbol: 'DGX',
    };

    const dgxRate = await getUniswapRate(env, {
      makerAsset: weth,
      takerAsset: dgx,
      nativeAsset: weth,
      takerQuantity: new BigNumber(1),
      targetExchange: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    });

    const ethRateInDgx = await getUniswapRate(env, {
      makerAsset: dgx,
      takerAsset: weth,
      nativeAsset: weth,
      takerQuantity: new BigNumber(1),
      targetExchange: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    });

    const observer = observeOrderbook([{ base: dgx, quote: weth }], { environment: env });
    const result: OrderbookUpdate = await new Promise((resolve, reject) => {
      observer.pipe(take(1)).subscribe(resolve, reject);
    });

    expect(result.bids[0].price).toStrictEqual(dgxRate);
    expect(result.asks[0].price).toStrictEqual(new BigNumber(1).dividedBy(ethRateInDgx));
  });
});
