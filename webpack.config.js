const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const ScratchWebpackConfigBuilder = require('scratch-webpack-configuration');

const common = {
    libraryName: 'scratch-vm',
    rootPath: path.resolve(__dirname)
};

const nodeBuilder = new ScratchWebpackConfigBuilder(common)
    .setTarget('node')
    .merge({
        entry: {
            'extension-worker': path.join(__dirname, 'src/extension-support/extension-worker.js')
        },
        output: {
            library: {
                name: 'VirtualMachine'
            }
        }
    });

const webBuilder = new ScratchWebpackConfigBuilder(common)
    .setTarget('browserslist')
    .merge({
        entry: {
            'extension-worker': path.join(__dirname, 'src/extension-support/extension-worker.js')
        },
        resolve: {
            fallback: {
                Buffer: require.resolve('buffer/')
            }
        },
        output: {
            library: {
                name: 'VirtualMachine'
            }
        }
    })
    .addModuleRule({
        test: require.resolve('./src/index.js'),
        loader: 'expose-loader',
        options: {
            exposes: 'VirtualMachine'
        }
    });

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
            'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug',
            'extension-worker': path.join(__dirname, 'src/extension-support/extension-worker.js')
        },
        output: {
            path: path.resolve(__dirname, 'playground'),
            library: {
                name: 'VirtualMachine'
            }
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
        test: require.resolve('scratch-blocks/dist/main.js'),
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
        test: require.resolve('scratch-render'),
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
