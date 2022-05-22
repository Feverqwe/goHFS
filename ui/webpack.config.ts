import {Configuration} from "webpack";
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as Path from "path";
import * as CopyPlugin from "copy-webpack-plugin";

export default (env: Record<string, any>, arg: Record<string, any>): Configuration => {
  const isProduction = arg.mode === 'production';

  return {
    entry: {
      folder: './src/folder',
      player: './src/player',
    },
    output: {
      filename: '[name]-[contenthash].js',
      chunkFilename: '[contenthash].chunk.js',
      publicPath: isProduction ? '/~/www' : '',
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
          use: [{
            loader: 'ts-loader',
          }],
          exclude: /node_modules/,
        },
        {
          test: /\.png$/,
          use: [{
            loader: 'url-loader',
          }],
        },
        {
          test: /\.less$/,
          use: [
            {
              loader: 'style-loader',
            }, {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            }, {
              loader: 'less-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'folder.html',
        template: './src/assets/folder.html',
        chunks: ['folder'],
        scriptLoading: 'blocking',
      }),
      new HtmlWebpackPlugin({
        filename: 'player.html',
        template: './src/assets/player.html',
        chunks: ['player'],
        scriptLoading: 'blocking',
      }),
      new CopyPlugin({
        patterns: [
          { from: "./src/assets/icons", to: "icons" },
        ],
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  };
};