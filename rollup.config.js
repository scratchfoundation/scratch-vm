// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';
import { base64 } from "rollup-plugin-base64";

export default {
	input: 'src/virtual-machine.mjs',
	output: {
		file: 'dist/bundle.js',
		strict: false,
		format: 'esm',
		inlineDynamicImports: true,
	},
	plugins: [
		resolve({
			moduleDirectories: ['node_modules']
		}),
		replace({
			'base64-loader!': '',
			delimiters: ['', ''],
			preventAssignment: true
		}),
		babel({ babelHelpers: 'bundled' }),
		json(),
		alias({
			entries: [
				// Mini log is no longer maintained
			  { find: 'minilog', replacement: 'pino-minilog' },
			]
		}),
		base64({
			include: ['**/*.otf','**/*.ttf'],
		}),
		commonjs({
			include: /node_modules/,
			requireReturnsDefault: 'auto', 
		}),
	],
};
