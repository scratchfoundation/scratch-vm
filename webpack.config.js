var webpack = require('webpack');

module.exports = {
    entry: {
        'vm': './src/index.js',
        'vm.min': './src/index.js'
    },
    output: {
        path: __dirname,
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: 'json-loader'
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
