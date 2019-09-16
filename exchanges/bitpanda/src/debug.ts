import debug from 'debug';

export const log = debug('ea:bitpanda:log');
log.log = console.log.bind(console);

export const error = debug('ea:bitpanda:error');
error.log = console.error.bind(console);
