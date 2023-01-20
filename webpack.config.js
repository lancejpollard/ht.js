const path = require('path')

const { fileURLToPath } = require('url')

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

module.exports = {
  context: path.resolve(__dirname),
  devtool: 'inline-source-map',
  entry: './test.tsx',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: './tsconfig.test.json',
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: 'example.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@Math': path.resolve(__dirname, './src/Math'),
      '@Geometry': path.resolve(__dirname, './src/Geometry'),
    },
  },
}
