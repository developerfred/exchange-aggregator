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
  base: 'MLN',
  quote: 'WETH',
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
const orders = [].concat(...promises);
// Aggregate all orders into a sorted orderbook with
// cummulative volume information.
const orderbook = createOrderbook(options, orders);
```
