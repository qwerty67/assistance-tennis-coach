const path = require('path');

function resolveWorkletsPlugin() {
  try {
    return require.resolve('react-native-worklets/plugin');
  } catch {
    const workspaceRoot = path.resolve(__dirname, '../../..');
    return path.resolve(workspaceRoot, 'products/coach-assistant/mobile/node_modules/react-native-worklets/plugin');
  }
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      resolveWorkletsPlugin(),
    ],
  };
};
