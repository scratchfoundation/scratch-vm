const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const ScratchWebpackConfigBuilder = require('scratch-webpack-configuration');

const common = {
    libraryName: 'scratch-vm',
    rootPath: path.resolve(__dirname)
};

const nodeBuilder = new ScratchWebpackConfigBuilder(common)
    .setTarget('node')
    .addModuleRule({
        test: /\.mp3$/,
        type: 'asset'
    });

const webBuilder = new ScratchWebpackConfigBuilder(common)
    .setTarget('browserslist')
    .merge({
        resolve: {
            fallback: {
                Buffer: require.resolve('buffer/')
            }
        }
    })
    .addModuleRule({
        test: /\.mp3$/,
        type: 'asset'
    })
    .addModuleRule({
        test: require.resolve('./src/index.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'VirtualMachine'
        }
    })
    .addPlugin(new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
    }));

const playgroundBuilder = webBuilder.clone()
    .merge({
        devServer: {
            contentBase: false,
            host: '0.0.0.0',
            port: process.env.PORT || 8073
        },
        performance: {
            hints: false
        },
        entry: {
            'benchmark': './src/playground/benchmark',
            'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug'
        },
        output: {
            path: path.resolve(__dirname, 'playground')
        }
    })
    .addModuleRule({
        test: require.resolve('stats.js/build/stats.min.js'),
        loader: 'script-loader'
    })
    .addModuleRule({
        test: require.resolve('./src/extensions/scratch3_video_sensing/debug.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'Scratch3VideoSensingDebug'
        }
    })
    .addModuleRule({
        test: require.resolve('scratch-blocks/dist/vertical.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'Blockly'
        }
    })
    .addModuleRule({
        test: require.resolve('scratch-audio/src/index.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'AudioEngine'
        }
    })
    .addModuleRule({
        test: require.resolve('scratch-storage/src/index.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'ScratchStorage'
        }
    })
    .addModuleRule({
        test: require.resolve('scratch-render/src/index.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'ScratchRender'
        }
    })
    .addPlugin(new CopyWebpackPlugin([
        {
            from: 'node_modules/scratch-blocks/media',
            to: 'media'
        },
        {
            from: 'node_modules/scratch-storage/dist/web'
        },
        {
            from: 'node_modules/scratch-render/dist/web'
        },
        {
            from: 'node_modules/scratch-svg-renderer/dist/web'
        },
        {
            from: 'src/playground'
        }
    ]));

module.exports = [
    nodeBuilder.get(),
    webBuilder.get(),
    playgroundBuilder.get()
];
