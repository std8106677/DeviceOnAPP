var webpack = require('webpack');
var merge = require('webpack-merge');
var path = require('path');
var baseWebpackConfig = require('./webpack.base.config');
var moment = require('moment');
module.exports = merge(baseWebpackConfig, {
  mode: 'production',
  entry: ["./src/index.js"],
  output: {
    path: path.resolve(__dirname, 'preview'), //__dirname,
    publicPath: "/",
    filename: "bundle.js"
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(moment().format('v.1.0.20.YYYY.MM.DD.HH.mm')),
      NAME: JSON.stringify("preview"),
      API_URL: JSON.stringify("https://preview-carrefour-ccm.ushop-plus.com/"),
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
    }),
  ],
});