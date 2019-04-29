import debug from 'debug';

export const log = debug('ea:ethfinex:log');
log.log = console.log.bind(console);

export const error = debug('ea:ethfinex:error');
error.log = console.error.bind(console);
