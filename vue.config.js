module.exports = {
  parallel: false,
  configureWebpack: {
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
