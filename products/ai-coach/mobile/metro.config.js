const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'products/coach-assistant/mobile/node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Provide polyfills and workspace aliases for shared packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  punycode: require.resolve('punycode/'),
  jalaliday: path.resolve(workspaceRoot, 'products/coach-assistant/mobile/node_modules/jalaliday'),
  zustand: path.resolve(workspaceRoot, 'products/coach-assistant/mobile/node_modules/zustand'),
  '@tennis-platform/design-system': path.resolve(workspaceRoot, 'packages/design-system/src'),
  '@tennis-platform/shared-hooks': path.resolve(workspaceRoot, 'packages/shared-hooks/src'),
  '@tennis-platform/shared-types': path.resolve(workspaceRoot, 'packages/shared-types/src'),
  '@tennis-platform/shared-utils': path.resolve(workspaceRoot, 'packages/shared-utils/src'),
};

module.exports = config;
