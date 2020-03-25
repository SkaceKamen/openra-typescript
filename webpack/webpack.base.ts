import { NODE_ENV } from './types'
import webpack from 'webpack'
import { join } from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import ForkTsCheckerNotifierWebpackPlugin from 'fork-ts-checker-notifier-webpack-plugin'
import CircularDependencyPlugin from 'circular-dependency-plugin'

const srcPath = (p?: string) => join(__dirname, '..', 'src', p || '')

export default (env: NODE_ENV) => {
	return {
		mode: env,

		stats: {
			all: false,
			colors: true,
			errors: true,
			errorDetails: true,
			timings: true,
			warnings: true
		},

		entry: [srcPath('index.ts')],

		devtool:
			env === 'development'
				? 'cheap-module-eval-source-map'
				: 'nosources-source-map',

		output: {
			path: join(__dirname, '..', 'dist'),
			filename: 'static/js/[name].[hash].bundle.js',
			chunkFilename:
				env === 'production'
					? 'static/js/[name].[contenthash:8].chunk.js'
					: 'static/js/[name].chunk.js'
		},

		module: {
			rules: [
				{
					test: /\.ts(x?)$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'ts-loader',
							options: {
								transpileOnly: true,
								compilerOptions: {
									target: 'es2016',
									module: 'esnext'
								}
							}
						}
					]
				},
				{
					test: /\.scss/,
					use: [
						...(env === 'development'
							? ['style-loader']
							: [MiniCssExtractPlugin.loader]),
						'css-loader'
					]
				},
				{
					test: /\.(frag|vert)$/i,
					use: 'raw-loader'
				}
			]
		},

		plugins: [
			...(env === 'development'
				? [new webpack.HotModuleReplacementPlugin()]
				: [new CleanWebpackPlugin(), new MiniCssExtractPlugin()]),

			new webpack.DefinePlugin({}),

			new HtmlWebpackPlugin({
				template: srcPath('index.html')
			}),

			new ForkTsCheckerWebpackPlugin({
				reportFiles: ['src/**/*.{ts,tsx}']
			}),
			new ForkTsCheckerNotifierWebpackPlugin(),

			new CircularDependencyPlugin({
				exclude: /node_modules/
			})
		],

		resolve: {
			extensions: ['.js', '.ts', '.tsx'],
			alias: {
				...(env === 'development'
					? { 'react-dom': '@hot-loader/react-dom' }
					: {}),
				'@': srcPath()
			}
		},

		devServer: {
			hot: true,
			historyApiFallback: true,
			contentBase: srcPath('../static')
		}
	} as webpack.Configuration
}
