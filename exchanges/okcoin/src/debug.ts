import debug from 'debug';

export const log = debug('ea:okcoin:log');
log.log = console.log.bind(console);

export const error = debug('ea:okcoin:error');
error.log = console.error.bind(console);
