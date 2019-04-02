import sourcemaps from 'rollup-plugin-sourcemaps';
import node from 'rollup-plugin-node-resolve';

function onwarn(message) {
  const suppressed = ['UNRESOLVED_IMPORT', 'THIS_IS_UNDEFINED'];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}

export const globals = {
  '@melonproject/ea-kraken': 'ea.kraken',
};

export default (name) => [
	{
		input: 'lib/index.js',
		onwarn,
		output: [
			{
				file: 'lib/bundle.umd.js',
				format: 'umd',
				name: `ea.${name}`,
				sourcemap: true,
				exports: 'named',
				globals,
			},
		],
    external: Object.keys(globals),
		plugins: [
			node({ module: true }),
			sourcemaps(),
		],
	},
];
