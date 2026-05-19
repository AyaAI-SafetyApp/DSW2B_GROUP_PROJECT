const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for some packages that might cause build issues
config.resolver.assetExts.push('db');

// Enable debugging and source maps
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Enable source maps for debugging
if (process.env.NODE_ENV === 'development') {
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: false,
  };
}

module.exports = config;