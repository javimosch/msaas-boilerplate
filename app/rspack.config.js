const path = require('path');
const rspack = require('@rspack/core');
const { VueLoaderPlugin } = require('vue-loader');
const { HtmlRspackPlugin, DefinePlugin } = rspack;

// Filter VUE_APP_* environment variables
const vueAppEnv = {};
Object.keys(process.env).forEach(key => {
  if (key.startsWith('VUE_APP_')) {
    vueAppEnv[key] = JSON.stringify(process.env[key]);
  }
});

module.exports = {
  entry: './src/main.js',
  mode: process.env.NODE_ENV || 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
  },
  devServer: {
    port: 3001,
    hot: true,
    historyApiFallback: true,
    open: true,
    compress: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.js$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: false,
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlRspackPlugin({
      template: './public/index.html',
    }),
    new DefinePlugin({
      'process.env': {
        ...(process.env.NODE_ENV ? {} : { NODE_ENV: JSON.stringify('development') }),
        ...vueAppEnv,
      },
    }),
  ],
};
