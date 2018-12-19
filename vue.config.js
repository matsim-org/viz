module.exports = {
  parallel: false,
  chainWebpack: config => {
    /*
     * the default loaders for worker files must be disabled. Otherwise both the default and the loaders defined below
     * will be applied to worker files. See also: https://github.com/vuejs/vue-cli/issues/2028
     */
    config.module.rule('js').exclude.add(/\.worker\.js$/)
    config.module.rule('ts').exclude.add(/\.worker\.ts$/)
  },
  configureWebpack: {
    /*
     * Setting the global object is necessary to make the loading of web-workers work. Otherwise, window is referenced
     * in the produced bundle, which is not accessable from a worker context. This seems to be a webpack 4 bug
     * https://github.com/webpack/webpack/issues/6642
     * https://github.com/webpack/webpack/issues/6629
     */
    output: {
      globalObject: 'self',
    },
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: [{ loader: 'worker-loader' }, { loader: 'babel-loader' }],
        },
        {
          test: /\.worker\.ts$/,
          use: [{ loader: 'worker-loader' }, { loader: 'babel-loader' }, { loader: 'ts-loader' }],
        },
      ],
    },
  },
}
