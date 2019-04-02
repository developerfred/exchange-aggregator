import debug from 'debug';

export const log = debug('ea:kraken:log');
log.log = console.log.bind(console);

export const error = debug('ea:kraken:error');
error.log = console.error.bind(console);
