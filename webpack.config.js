var webpack = require('webpack');

var base = {
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: 'json-loader'
            }, {
                test: require.resolve('./src/index.js'),
                loader: 'expose?VirtualMachine'
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true,
            compress: {
                warnings: false
            }
        })
    ]
};

module.exports = [Object.assign({}, base, {
    entry: {
        'vm': './src/index.js',
        'vm.min': './src/index.js'
    },
    output: {
        path: __dirname,
        filename: '[name].js'
    }
}), Object.assign({}, base, {
    entry: {
        'dist': './src/index.js'
    },
    output: {
        library: 'VirtualMachine',
        libraryTarget: 'commonjs2',
        path: __dirname,
        filename: '[name].js'
    }
})];
