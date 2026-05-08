const { validateEnv } = require("./utils/env.js");
const Bot = require("./client.js");
const { log } = require("./utils/logger");

if (!validateEnv()) {
  log.error("Failed to validate environment variables. Shutting down.");
  process.exit(1);
}

const bot = new Bot();
bot.start().catch((err) => {
  log.error("Fatal error during bot startup:", err);
  process.exit(1);
});
