const gridPlugin = require("../plugins/gridPlugin");
const sortingPlugin = require("../plugins/sortingPlugin");

const plugins = {
  [gridPlugin.levelType]: gridPlugin,
  [sortingPlugin.levelType]: sortingPlugin,
};

function getPlugin(levelType) {
  const plugin = plugins[levelType];

  if (!plugin) {
    throw new Error(`Geen plugin gevonden voor levelType: ${levelType}`);
  }

  return plugin;
}

module.exports = {
  getPlugin,
};
