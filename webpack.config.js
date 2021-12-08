const path =require('path');
const Dotenv =require('dotenv-webpack');

module.exports = {
    entry: './index.js',
    output: {
        filename: 'awesome.js',
        path: path.resolve(__dirname, 'dist'),
    },
  plugins: [
      new Dotenv(),
  ],
};
