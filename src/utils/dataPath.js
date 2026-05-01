const fs = require("fs");
const path = require("path");
const { config } = require("./env.js");

function getDataFilePath(filename) {
  fs.mkdirSync(config.dataPath, { recursive: true });
  return path.join(config.dataPath, filename);
}

module.exports = { getDataFilePath };
