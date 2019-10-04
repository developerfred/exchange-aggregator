export { Authentication } from './types';
export { CallLimit } from './types';

/* ACCOUNT */
export { currencies } from './account/currencies';
export { wallet } from './account/wallet';
export { transfer } from './account/transfer';
export { withdrawal } from './account/withdrawal';
export { withdrawalfee } from './account/withdrawalfee';
export { withdrawalhistory } from './account/withdrawalhistory';
export { ledger as ledgerAccount } from './account/ledger';
export { depositaddress } from './account/depositaddress';
export { deposithistory } from './account/deposithistory';

/* SPOT */
export { instruments } from './spot/instruments';
export { accounts } from './spot/accounts';
export { currency } from './spot/currency';
// export { ledger as ledgerSpot} from './spot/ledger';
export { placeorder } from './spot/placeorder';
export { cancelorders } from './spot/cancelorders';
export { orderslist } from './spot/orderslist';
export { openorders } from './spot/openorders';
