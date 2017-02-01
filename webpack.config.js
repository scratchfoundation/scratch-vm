var CopyWebpackPlugin = require('copy-webpack-plugin');
var defaultsDeep = require('lodash.defaultsdeep');
var path = require('path');
var webpack = require('webpack');

var base = {
    devServer: {
        contentBase: path.resolve(__dirname, 'playground'),
        host: '0.0.0.0',
        port: process.env.PORT || 8073
    },
    devtool: 'source-map',
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
            rules: [
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader?VirtualMachine'
                }
            ]
        }
    }),
    // Node-compatible
    defaultsDeep({}, base, {
        target: 'node',
        entry: {
            'scratch-vm': './src/index.js'
        },
        output: {
            library: 'VirtualMachine',
            libraryTarget: 'commonjs2',
            path: path.resolve(__dirname, 'dist/node'),
            filename: '[name].js'
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
                // Renderer
                'scratch-render',
                // Audio
                'scratch-audio'
            ]
        },
        output: {
            path: path.resolve(__dirname, 'playground'),
            filename: '[name].js'
        },
        module: {
            loaders: [
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
                    test: require.resolve('scratch-render'),
                    loader: 'expose-loader?RenderWebGL'
                },
                {
                    test: require.resolve('scratch-audio'),
                    loader: 'expose-loader?AudioEngine'
                }
            ]
        },
        plugins: base.plugins.concat([
            new CopyWebpackPlugin([{
                from: 'node_modules/scratch-blocks/media',
                to: 'media'
            }, {
                from: 'node_modules/highlightjs/styles/zenburn.css'
            }])
        ])
    })
];
