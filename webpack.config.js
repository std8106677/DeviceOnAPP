var webpack = require('webpack');
var merge = require('webpack-merge');
var path = require('path');
var baseWebpackConfig = require('./webpack.base.config');
var moment =require('moment');
module.exports = merge(baseWebpackConfig, {
    entry: [
      'webpack/hot/dev-server',
      'webpack-dev-server/client?http://localhost:8080',"./src/index.js"],
    output: {
      path: path.resolve(__dirname, 'dev'),//__dirname,
      publicPath: "/",
      filename: "bundle.js"
    },
    devServer: {
      disableHostCheck: true, // That solved it
      historyApiFallback: true,
      contentBase: "./",
      compress: true,
      port: 8080,
      inline: true,
      host: '0.0.0.0',
    },
    plugins:[
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(moment().format('YYYY.MM.DD.HH.mm.ss')),
        NAME:JSON.stringify("cf-dev"),
        API_URL:JSON.stringify("https://cf-ccm-dev.ushop-plus.com"),
      })
    ],
});
