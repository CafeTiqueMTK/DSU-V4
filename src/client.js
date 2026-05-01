const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const db = require("./db.js");
const UpdateChecker = require("./update-checker.js");
const { config } = require("./utils/env.js");
const { loadCommands } = require("./utils/commandLoader.js");

class Bot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
      ],
    });

    this.commands = new Collection();
    this.updateChecker = new UpdateChecker(this);
  }

  async start() {
    console.log("🚀 Initializing DSU V4...");

    // 1. Initialize Database
    try {
      await db.init();
      console.log("✅ Database initialized.");
    } catch (err) {
      console.error("❌ Database failed to initialize:", err);
    }

    // 2. Load commands and events
    this.loadCommands();
    this.loadEvents();

    // 3. Deploy commands if requested
    if (config.deployCommands) {
      await this.deployCommands();
    }

    // 4. Setup Ready Event
    this.once("ready", () => {
      console.log(`🚀 Logged in as ${this.user.tag}`);
      this.updateChecker.start();
    });

    // 5. Handle Shutdown
    this.setupGracefulShutdown();

    // 6. Login
    try {
      await this.login(config.token);
    } catch (err) {
      console.error("❌ Failed to login to Discord:", err);
      process.exit(1);
    }
  }

  loadCommands() {
    const commandsPath = path.join(__dirname, "commands");
    const { commandsArray } = loadCommands(this, commandsPath);
    this.commandsArray = commandsArray;
    console.log(`✅ Loaded ${this.commands.size} commands.`);
  }

  loadEvents() {
    const eventsPath = path.join(__dirname, "events");
    if (!fs.existsSync(eventsPath)) {
      console.warn("⚠️ Events directory not found.");
      return;
    }
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((f) => f.endsWith(".js"));

    for (const file of eventFiles) {
      try {
        const event = require(path.join(eventsPath, file));
        const handler = (...args) => event.execute(...args);
        if (event.once) this.once(event.name, handler);
        else this.on(event.name, handler);
      } catch (err) {
        console.warn(`[WARN] Failed to load event ${file}: ${err.message}`);
      }
    }
    console.log(`✅ Loaded ${eventFiles.length} events.`);
  }

  async deployCommands() {
    const rest = new REST({ version: "10" }).setToken(config.token);
    try {
      console.log("🔄 Deploying slash commands...");
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: this.commandsArray,
      });
      console.log("✅ Commands deployed.");
    } catch (error) {
      console.error("❌ Deployment error:", error);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down...`);
      this.updateChecker.stop();
      await db.shutdown();
      this.destroy();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
    });

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Rejection:", reason);
    });
  }
}

module.exports = Bot;
