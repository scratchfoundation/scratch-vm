// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
	input: 'src/virtual-machine.mjs',
	output: {
		file: 'dist/bundle.js',
		format: 'esm'
	},
	plugins: [
		resolve({
			moduleDirectories: ['node_modules']
		}),
		babel({ babelHelpers: 'bundled' })
	],
};
