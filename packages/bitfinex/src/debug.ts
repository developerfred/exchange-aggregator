import debug from 'debug';

export const log = debug('ea:bitfinex:log');
log.log = console.log.bind(console);

export const error = debug('ea:bitfinex:error');
error.log = console.error.bind(console);
