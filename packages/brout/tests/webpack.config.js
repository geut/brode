import HtmlWebpackPlugin from 'html-webpack-plugin'

export default {
  mode: 'development',

  devtool: 'eval-cheap-module-source-map',

  target: 'web',

  devServer: {
    liveReload: false,
    host: '127.0.0.1',
    port: 3000
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development'
    })
  ]
}
