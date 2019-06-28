import addresses from './addresses/mainnet.json';
import { getExpectedRate } from './api/calls/getExpectedRate';
import { createEnvironment } from './createEnvironment';
import { Eth } from 'web3-eth';
import { HttpProvider } from 'web3-providers';
import * as Rx from 'rxjs';
import { map } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { Environment } from './types.js';

const fetchOrders = (
  environment: Environment,
  base: string,
  quote: string,
  quantities: number[],
) => {
  const asks = quantities.map(qty => {
    return Rx.defer(() => {
      return getExpectedRate(environment, {
        srcToken: base,
        destToken: quote,
        srcQty: qty.toString(),
      });
    }).pipe(
      map(result => {
        if (result.expectedRate.isZero()) {
          return undefined;
        }

        return {
          price: result.expectedRate,
          volume: new BigNumber(qty),
        };
      }),
    );
  });

  const bids = quantities.map(qty => {
    return Rx.defer(() => {
      return getExpectedRate(environment, {
        srcToken: quote,
        destToken: base,
        srcQty: qty.toString(),
      });
    }).pipe(
      map(result => {
        if (result.expectedRate.isZero()) {
          return undefined;
        }

        return {
          price: new BigNumber(1).dividedBy(result.expectedRate),
          volume: new BigNumber(qty).negated(),
        };
      }),
    );
  });

  const observables = [...asks, ...bids];
  return Rx.forkJoin(...observables);
};

const rpcUrl = 'https://mainnet.infura.io/v3/a0dcc5ab3b1a4bd49990810564edba93';
const ETH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const DGX = '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf';

jest.setTimeout(1000000);

describe('kyber', () => {
  it('getExpectedRate', async () => {
    const environment = createEnvironment({
      eth: new Eth(new HttpProvider(rpcUrl)),
      addresses,
    });

    const output = await new Promise(resolve => {
      fetchOrders(environment, ETH, DGX, [1, 10, 100, 1000]).subscribe(
        result => {
          resolve(result);
        },
      );
    });

    console.log(output);
  });
});
