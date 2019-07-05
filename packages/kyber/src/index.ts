import mainnet from './addresses/mainnet.json';
import * as api from './api';
import * as abstract from './abstract';

const addresses = { mainnet };

export { createEnvironment } from './createEnvironment';
export { api, abstract, addresses };
