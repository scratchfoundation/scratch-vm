const CopyWebpackPlugin = require('copy-webpack-plugin');
const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    output: {
        library: 'VirtualMachine',
        libraryTarget: 'umd',
        filename: '[name].js'
    },
    resolve: {
        fallback: {
            Buffer: require.resolve('buffer/')
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            include: path.resolve(__dirname, 'src'),
            options: {
                presets: [['@babel/preset-env', {targets: {browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']}}]]
            }
        },
        {
            test: /\.mp3$/,
            loader: 'file-loader'
        }]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                include: /\.min\.js$/
            })
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer']
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
            path: path.resolve('dist', 'web')
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'VirtualMachine'
                    }
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
            path: path.resolve('dist', 'node')
        },
        externals: {
            'decode-html': true,
            'format-message': true,
            'htmlparser2': true,
            'immutable': true,
            'jszip': true,
            'minilog': true,
            'scratch-parser': true,
            'socket.io-client': true,
            'text-encoding': true
        }
    }),
    // Playground
    defaultsDeep({}, base, {
        target: 'web',
        devServer: {
            contentBase: false,
            host: '0.0.0.0',
            port: process.env.PORT || 8073
        },
        entry: {
            'benchmark': './src/playground/benchmark',
            'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug'
        },
        output: {
            path: path.resolve(__dirname, 'playground'),
            filename: '[name].js'
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'VirtualMachine'
                    }
                },
                {
                    test: require.resolve('./src/extensions/scratch3_video_sensing/debug.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'Scratch3VideoSensingDebug'
                    }
                },
                {
                    test: require.resolve('stats.js/build/stats.min.js'),
                    loader: 'script-loader'
                },
                {
                    test: require.resolve('scratch-blocks/dist/vertical.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'Blockly'
                    }
                },
                {
                    test: require.resolve('scratch-audio/src/index.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'AudioEngine'
                    }
                },
                {
                    test: require.resolve('scratch-storage/src/index.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'ScratchStorage'
                    }
                },
                {
                    test: require.resolve('scratch-render/src/index.js'),
                    loader: 'expose-loader',
                    options: {
                        exposes: 'ScratchRender'
                    }
                }
            ])
        },
        performance: {
            hints: false
        },
        plugins: base.plugins.concat([
            new CopyWebpackPlugin([{
                from: 'node_modules/scratch-blocks/media',
                to: 'media'
            }, {
                from: 'node_modules/scratch-storage/dist/web'
            }, {
                from: 'node_modules/scratch-render/dist/web'
            }, {
                from: 'node_modules/scratch-svg-renderer/dist/web'
            }, {
                from: 'src/playground'
            }])
        ])
    })
];
