const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // El SaaS web (Next.js) vive en web/ dentro del monorepo; Metro no debe
  // empaquetarlo ni colisionar con su node_modules.
  resolver: {
    blockList: exclusionList([/web\/.*/]),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
