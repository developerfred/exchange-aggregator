import debug from 'debug';

export const log = debug('ea:bittrex:log');
log.log = console.log.bind(console);

export const error = debug('ea:bittrex:error');
error.log = console.error.bind(console);
