import { getUniswapRate } from '../../api/calls/getUniswapRate';
import { fetch } from './fetch';
import { Eth } from 'web3-eth';
import { createEnvironment } from '../../createEnvironment';
import mainnet from '../../addresses/mainnet.json';
import BigNumber from 'bignumber.js';
import { Token } from '@melonproject/ea-common';

describe('fetch', () => {
  it('should produce the same values as a singular fetch', async () => {
    const eth = await new Eth(process.env.JSON_RPC_ENDPOINT);
    const env = await createEnvironment({ eth, addresses: mainnet });

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
      targetExchange: mainnet.UniswapFactory,
    });

    const ethRateInDgx = await getUniswapRate(env, {
      makerAsset: dgx,
      takerAsset: weth,
      nativeAsset: weth,
      takerQuantity: new BigNumber(1),
      targetExchange: mainnet.UniswapFactory,
    });

    const result = await fetch({ base: dgx, quote: weth, environment: env });
    expect(result.bids[0].price).toStrictEqual(dgxRate);
    expect(result.asks[0].price).toStrictEqual(new BigNumber(1).dividedBy(ethRateInDgx));
  });
});
