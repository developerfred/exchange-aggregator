import debug from 'debug';

export const log = debug('ea:uniswap:log');
log.log = console.log.bind(console);

export const error = debug('ea:uniswap:error');
error.log = console.error.bind(console);
