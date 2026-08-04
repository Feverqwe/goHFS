import {defineConfig} from '@rspack/cli';
import {rspack} from '@rspack/core';
import * as Path from 'path';

export default defineConfig({
  experiments: {
    css: true,
  },
  entry: {
    folder: './src/folder',
    player: './src/player',
  },
  output: {
    filename: '[name]-[contenthash].js',
    chunkFilename: '[contenthash].chunk.js',
    publicPath: '/~/www',
    path: Path.resolve(__dirname, './dist'),
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2,
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'classic',
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        type: 'css/auto',
        sideEffects: true,
      },
      {
        test: /\.png$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      filename: 'folder.html',
      template: './src/assets/folder.html',
      chunks: ['folder'],
      scriptLoading: 'blocking',
    }),
    new rspack.HtmlRspackPlugin({
      filename: 'player.html',
      template: './src/assets/player.html',
      chunks: ['player'],
      scriptLoading: 'blocking',
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{from: './src/assets/icons', to: 'icons'}],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000,
  },
});
