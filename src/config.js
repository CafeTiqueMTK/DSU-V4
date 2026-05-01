const { getGuildData, saveGuildData } = require("./utils/guildManager");

function getGuildSettings(guildId) {
  const store = getGuildData(guildId, "settings");
  return store[guildId];
}

function updateGuildSettings(guildId, settings) {
  const store = getGuildData(guildId, "settings");
  store[guildId] = settings;
  return saveGuildData(guildId, store, "settings");
}

function getAllSettings() {
  return getGuildData("global", "settings");
}

function writeAllSettings(settings) {
  for (const guildId of Object.keys(settings)) {
    updateGuildSettings(guildId, settings[guildId]);
  }
}

module.exports = {
  getGuildSettings,
  updateGuildSettings,
  getAllSettings,
  writeAllSettings,
};
