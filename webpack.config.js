const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const Crx = require('crx-webpack-plugin')
const { version } = require('./package.json')

module.exports = {
  mode: 'development',
  entry: {
    popup: './src/js/popup.js',
    background: './src/js/background.js',
    'in-content': './src/js/in-content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  cache: true,
  devtool: 'eval-cheap-module-source-map',

  module: {
    rules: [
      {
        test: /\.js?$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader'
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000,
            },
          },
        ],
      },
    ]
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './manifest.json' },
        { from: './src/images' },
        { from: './src/views' }
      ]
    })
  ]
}
