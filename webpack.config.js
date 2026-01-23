const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    filename: 'nrd-common.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'NRDCommon',
      type: 'umd',
    },
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.js'],
  },
  experiments: {
    outputModule: false, // Use UMD format, not ES modules
  },
  // Don't bundle dependencies, assume they're available
  externals: {
    // If we need to exclude any dependencies in the future
  }
};
