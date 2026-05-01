require("dotenv").config();
const { validateEnv } = require("./utils/env.js");
const Bot = require("./client.js");

if (!validateEnv()) {
  process.exit(1);
}

const bot = new Bot();
bot.start();
