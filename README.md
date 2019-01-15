# Exchange aggregator

## Installation

```
# With yarn
yarn add @melonproject/exchange-aggregator

# With npm
npm install @melonproject/exchange-aggregator
```

## Usage example

Please note, that not all asset pairs are available on all exchanges.

```typescript
import { Network, exchanges, aggregateOrders, createOrderbook } from '@melonproject/exchange-aggregator';

const options = {
  network: Network.MAINNET,
  pair: {
    // The token pair is used for constructing the proper
    // requests (e.g. endpoint urls) and calculations in
    // token-math.
    base: createToken('ZRX', undefined, 18),
    quote: createToken('WETH', undefined, 18),
  },
};

const environment = constructEnvironment({
  endpoint: 'ws://localhost:8545',
});

const promises = await Promise.all([
  exchanges.radarrelay.fetch(options),
  // Some exchanges require extra configuration.
  exchanges.oasisdex.fetch({
    ...options,
    environment,
  }),
]);

// Concatenate the api responses into a single array.
const allOrders = [].concat(...promises);

// Aggregate all orders into a sorted orderbook with
// cummulative volume information.
const asksAndBids = aggregateOrders(allOrders);
const orderbook = createOrderbook(options, asksAndBids);
```
