const os = require('os')
const path = require('path')

module.exports = {
  parallel: true,
  productionSourceMap: false,
  chainWebpack: config => {
    /*
     * the default loaders for worker files must be disabled. Otherwise both the default and the loaders defined below
     * will be applied to worker files. See also: https://github.com/vuejs/vue-cli/issues/2028
     */
    config.module.rule('js').exclude.add(/\.worker\.js$/)
    config.module.rule('ts').exclude.add(/\.worker\.ts$/)
  },
  configureWebpack: {
    // devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          include: path.resolve(__dirname, 'src'),
          use: [{ loader: 'worker-loader' }],
        },
        {
          test: /\.worker\.ts$/,
          include: path.resolve(__dirname, 'src'),
          use: [{ loader: 'worker-loader' }, { loader: 'ts-loader' }],
        },
      ],
    },
  },
}
