const db = require("../db.js");

function getGuildData(guildId, dataType = "settings") {
  const guildIdStr = guildId.toString();

  if (dataType === "settings") {
    return db.legacyStores.get("settings.json") || {};
  }

  const filename = `${dataType}.json`;
  const data = db.legacyStores.get(filename) || {};
  if (!data[guildIdStr]) data[guildIdStr] = {};
  db.legacyStores.set(filename, data);
  return data;
}

function saveGuildData(guildId, data, dataType = "settings") {
  const guildIdStr = guildId.toString();

  if (dataType === "settings") {
    db.legacyStores.set("settings.json", data);
    // Trigger persistence for each guild in the data if needed,
    // but db.set("updates.json") already does something similar.
    // For now, just set it in legacyStores as the original code intended.
    return true;
  }

  db.legacyStores.set(`${dataType}.json`, data);
  return true;
}

function getUserData(userId, dataType = "coins") {
  const filename = `${dataType}.json`;
  const data = db.legacyStores.get(filename) || {};
  if (!data[userId]) {
    data[userId] =
      dataType === "work" ? { lastWork: 0, streak: 0 } : { coins: 0 };
  }
  db.legacyStores.set(filename, data);
  return data;
}

function saveUserData(userId, data, dataType = "coins") {
  const filename = `${dataType}.json`;
  const allData = db.legacyStores.get(filename) || {};
  allData[userId] = data;
  db.legacyStores.set(filename, allData);
  return true;
}

function ensureDataDirectory() {
  return true;
}

function initializeDataFiles() {
  return true;
}

module.exports = {
  getGuildData,
  saveGuildData,
  getUserData,
  saveUserData,
  ensureDataDirectory,
  initializeDataFiles,
};
