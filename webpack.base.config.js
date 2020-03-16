var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
  entry: ["./src/index.js"],
  output: {
    path: path.resolve(__dirname, 'dist'), //__dirname,
    publicPath: "/",
    filename: "bundle.js"
  },
  module: {
    loaders: [{
        exclude: /node_modules/,
        loader: "babel",
        query: {
          presets: ["react", "es2015", "stage-1"]
        }
      },
    ],
  },
  resolve: {
    extensions: ["", ".js", ".jsx"]
  },
  
  plugins: [
    new HtmlWebpackPlugin({ //根据模板插入css/js等生成最终HTML
      // favicon: './src/img/favicon.ico', //favicon路径
      filename: '/index.html', //生成的html存放路径，相对于 path
      template: './index.html', //html模板路径
      inject: true, //允许插件修改哪些内容，包括head与body
      hash: true, //为静态资源生成hash值
      minify: { //压缩HTML文件
        removeComments: true, //移除HTML中的注释
        collapseWhitespace: false //删除空白符与换行符
      }
    }),
    new CopyWebpackPlugin([
      { from: './img', to: './img' },
      { from: './style', to: './style' },    
    ])
  ],
};