const path = require('path')

const { fileURLToPath } = require('url')

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

module.exports = {
  context: path.resolve(__dirname),
  devtool: 'inline-source-map',
  entry: './test.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: 'example.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
}
