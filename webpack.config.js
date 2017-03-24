var CopyWebpackPlugin = require('copy-webpack-plugin');
var defaultsDeep = require('lodash.defaultsdeep');
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

/**
 * Resolve a babel plugin or preset to a real path, resolving symlinks the way that Node.js would.
 * Helps work around the differences between webpack's module lookup and Node's when `npm link` is in use.
 * @param {string} prefix - 'babel-plugin' for a plugin, 'babel-preset' for a preset, etc.
 * @param {string|Array} item - either a plugin/preset name or path or an array with such a string at index 0.
 * @returns {string|Array} - the same type as `item` but the name/path will be replaced with an absolute path.
 */
const babelRealPath = function (prefix, item) {
    if (typeof item === 'string') {
        if (item.indexOf(prefix) !== 0) {
            item = [prefix, item].join('-');
        }
        return fs.realpathSync(require.resolve(item));
    }
    item[0] = babelRealPath(prefix, item[0]);
    return item;
};

var base = {
    devServer: {
        contentBase: false,
        host: '0.0.0.0',
        port: process.env.PORT || 8073
    },
    devtool: 'cheap-module-source-map',
    module: {
        rules: [
            {
                include: [
                    path.resolve(__dirname, 'node_modules', 'scratch-audio', 'src'),
                    path.resolve(__dirname, 'node_modules', 'scratch-render', 'src'),
                    path.resolve(__dirname, 'node_modules', 'scratch-storage', 'src'),
                    path.resolve(__dirname, 'src')
                ].map(x => fs.realpathSync(x)),
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        'es2015'
                    ].map(x => babelRealPath('babel-preset', x))
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true
        })
    ]
};

module.exports = [
    // Web-compatible
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'scratch-vm': './src/index.js',
            'scratch-vm.min': './src/index.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist/web'),
            filename: '[name].js'
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader?VirtualMachine'
                }
            ])
        }
    }),
    // Playground
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'scratch-vm': './src/index.js',
            'vendor': [
                // FPS counter
                'stats.js/build/stats.min.js',
                // Syntax highlighter
                'highlightjs/highlight.pack.min.js',
                // Scratch Blocks
                'scratch-blocks/dist/vertical.js',
                // Audio
                'scratch-audio',
                // Renderer
                'scratch-render',
                // Storage
                'scratch-storage'
            ]
        },
        output: {
            path: path.resolve(__dirname, 'playground'),
            filename: '[name].js'
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader?VirtualMachine'
                },
                {
                    test: require.resolve('stats.js/build/stats.min.js'),
                    loader: 'script-loader'
                },
                {
                    test: require.resolve('highlightjs/highlight.pack.min.js'),
                    loader: 'script-loader'
                },
                {
                    test: require.resolve('scratch-blocks/dist/vertical.js'),
                    loader: 'expose-loader?Blockly'
                },
                {
                    test: require.resolve('scratch-audio'),
                    loader: 'expose-loader?AudioEngine'
                },
                {
                    test: require.resolve('scratch-render'),
                    loader: 'expose-loader?RenderWebGL'
                },
                {
                    test: require.resolve('scratch-storage'),
                    loader: 'expose-loader?Scratch.Storage'
                }
            ])
        },
        plugins: base.plugins.concat([
            new CopyWebpackPlugin([{
                from: 'node_modules/scratch-blocks/media',
                to: 'media'
            }, {
                from: 'node_modules/highlightjs/styles/zenburn.css'
            }, {
                from: 'src/playground'
            }])
        ])
    })
];
