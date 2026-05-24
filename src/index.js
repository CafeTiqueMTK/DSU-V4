const { validateEnv, config } = require("./utils/env.js");
const Bot = require("./client.js");
const { log } = require("./utils/logger");
const path = require("path");
const { getCommandFiles } = require("./utils/commandLoader");

/**
 * DSU-V4 CORE SUPERVISOR
 * This is the hyper-stable heart of the bot.
 * It must never crash and handles all top-level failures.
 */

if (!validateEnv()) {
  log.error("Failed to validate environment variables. Shutting down.");
  process.exit(1);
}

// Global Stability Listeners
process.on("uncaughtException", async (err) => {
  log.error("🛡️ [CORE] Uncaught Exception captured. Process must restart for stability:", err);

  // Important: After logging, we exit so PM2/Docker can restart the bot cleanly.
  // Continuing after uncaughtException is dangerous as the state is undefined.
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log.error("🛡️ [CORE] Unhandled Rejection captured at:", promise, "reason:", reason);
  // Unhandled rejections don't necessarily require a restart, but we log them carefully.
});

const bot = new Bot();

// Internal Watchdog Logic
setInterval(async () => {
    if (bot.isReady()) {
        // --- 🛡️ MODULE WATCHDOG ---
        // Proactively detect missing or failed modules
        const commandsPath = path.join(__dirname, "commands");
        const commandFiles = getCommandFiles(commandsPath);

        // Simple heuristic: if we have fewer commands than files (considering most files have 1 command),
        // or specifically checking for critical test modules in CRASH_MODE.
        if (config.crashMode) {
            const hasFunModule = commandFiles.some(f => f.includes("fun.js")) && bot.commands.some(c => c.data.name === "hug"); // hug is in fun.js

            if (!hasFunModule) {
                log.warn("🛡️ [WATCHDOG] Partial Failure Detected: 'fun' module is missing or failed to load.");
                // We could trigger a notification here if not already sent
            }
        }
    }
}, 30000);

// Start the bot with a supervisor wrapper
(async () => {
    try {
        log.info("🛡️ Core Supervisor starting bot...");
        await bot.start();
    } catch (err) {
        log.error("🛡️ [CORE] Fatal error during bot startup sequence:", err);
        process.exit(1);
    }
})();

module.exports = { bot };
