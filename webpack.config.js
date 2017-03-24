var CopyWebpackPlugin = require('copy-webpack-plugin');
var defaultsDeep = require('lodash.defaultsdeep');
var path = require('path');
var webpack = require('webpack');

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
                ],
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true
        })
    ],
    resolve: {
        symlinks: false
    }
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
                    test: path.resolve(__dirname, 'node_modules', 'scratch-audio', 'src', 'index.js'),
                    loader: 'expose-loader?AudioEngine'
                },
                {
                    test: path.resolve(__dirname, 'node_modules', 'scratch-render', 'src', 'index.js'),
                    loader: 'expose-loader?RenderWebGL'
                },
                {
                    test: path.resolve(__dirname, 'node_modules', 'scratch-storage', 'src', 'index.js'),
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
