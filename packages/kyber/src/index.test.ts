import addresses from './addresses/mainnet.json';
import { getExpectedRate } from './api/calls/getExpectedRate';
import { createEnvironment } from './createEnvironment';
import { Eth } from 'web3-eth';
import { HttpProvider } from 'web3-providers';

const rpcUrl = 'https://mainnet.melonport.com';
const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const MLN = '0xec67005c4e498ec7f55e092bd1d35cbc47c91892';

describe('kyber', () => {
  it('getExpectedRate', async () => {
    // const environment = createEnvironment({
    //   eth: new Eth(new HttpProvider(rpcUrl)),
    //   addresses,
    // });
    // const output = await getExpectedRate(environment, {
    //   srcToken: ETH,
    //   destToken: MLN,
    //   srcQty: '1',
    // });
    // console.log(output);
  });
});
