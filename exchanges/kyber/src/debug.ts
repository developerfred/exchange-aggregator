import debug from 'debug';

export const log = debug('ea:kyber:log');
log.log = console.log.bind(console);

export const error = debug('ea:kyber:error');
error.log = console.error.bind(console);
