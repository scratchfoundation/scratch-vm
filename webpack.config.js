const CopyWebpackPlugin = require('copy-webpack-plugin');
const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const webpack = require('webpack');

const base = {
    devServer: {
        contentBase: false,
        host: '0.0.0.0',
        port: process.env.PORT || 8073
    },
    devtool: 'cheap-module-source-map',
    output: {
        library: 'VirtualMachine',
        filename: '[name].js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            include: path.resolve(__dirname, 'src'),
            query: {
                presets: ['es2015']
            }
        },
        {
            test: /\.mp3$/,
            loader: 'file-loader'
        }]
    },
    plugins: process.env.NODE_ENV === 'production' ? [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true
        })
    ] : []
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
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web')
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
    // Node-compatible
    defaultsDeep({}, base, {
        target: 'node',
        entry: {
            'scratch-vm': './src/index.js'
        },
        output: {
            libraryTarget: 'commonjs2',
            path: path.resolve('dist', 'node')
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
                // Storage
                'scratch-storage',
                // Renderer
                'scratch-render'
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
                    test: require.resolve('scratch-storage'),
                    loader: 'expose-loader?ScratchStorage'
                },
                {
                    test: require.resolve('scratch-render'),
                    loader: 'expose-loader?ScratchRender'
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
                from: 'node_modules/scratch-storage/dist/web'
            }, {
                from: 'node_modules/scratch-render/dist/web'
            }, {
                from: 'src/playground'
            }])
        ])
    })
];
