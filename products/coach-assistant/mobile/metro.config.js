const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Project root is the mobile app folder
const projectRoot = __dirname;
// Workspace root is 3 levels up: products/coach-assistant/mobile -> tennis-coach
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (for packages/design-system etc.)
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
