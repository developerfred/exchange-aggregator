import commander, { Command } from 'commander';

export type Program = Command;

const exchanges = ['bitfinex', 'bittrex', 'kraken', 'kyber', 'uniswap'];
const installed = exchanges.reduce(
  (carry, current) => {
    try {
      const dependency = `@melonproject/ea-${current}`;
      const cli = require.resolve(`${dependency}/lib/cli`);

      return {
        ...carry,
        [current]: cli,
      };
    } catch (e) {
      // The module is not installed.
    }

    return carry;
  },
  {} as { [key: string]: string },
);

Object.keys(installed).forEach(exchange => {
  const dependency = installed[exchange];
  commander
    .command(exchange)
    .action(() => {
      const program = new Command();
      const args = process.argv.slice(1);

      require(dependency).default(program, args);
    })
    .allowUnknownOption();
});

commander.on('command:*', () => {
  commander.help();
  process.exit(1);
});

commander.parse(process.argv);
if (!commander.args.length) {
  commander.help();
  process.exit(1);
}
