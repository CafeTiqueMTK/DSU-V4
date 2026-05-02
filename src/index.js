const isProduction =
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.VERCEL ||
  process.env.NODE_ENV === "production";

if (!isProduction) {
  require("dotenv").config();
}

const { validateEnv } = require("./utils/env.js");
const Bot = require("./client.js");

if (!validateEnv()) {
  process.exit(1);
}

const bot = new Bot();
bot.start();
