const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for some packages that might cause build issues
config.resolver.assetExts.push('db');

// Add Node.js core module polyfills for expo-notifications
config.resolver.extraNodeModules = {
  util: require.resolve('util/'),
  assert: require.resolve('assert/'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer/'),
};

module.exports = config;