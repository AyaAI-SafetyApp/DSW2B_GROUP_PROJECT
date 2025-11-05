const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db');

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

if (process.env.NODE_ENV === 'development') {
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: false,
  };
}

module.exports = config;