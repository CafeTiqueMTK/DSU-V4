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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.commands = new Collection();
    this.updateChecker = new UpdateChecker(this);

    // Initialize services
    const EconomyService = require("./modules/economy/EconomyService");
    const ModerationService = require("./modules/moderation/ModerationService");
    const MarriageService = require("./modules/marriage/MarriageService");
    const TicketService = require("./modules/tickets/TicketService");
    const RoleService = require("./modules/roles/RoleService");
    const FormService = require("./modules/forms/FormService");

    db.setServices(
        new EconomyService(db),
        new ModerationService(db),
        new MarriageService(db),
        new TicketService(db),
        new RoleService(db),
        new FormService(db)
    );

    // Load and compile banwords
    try {
      const banwordPath = path.join(process.cwd(), "data", "banword.json");
      if (fs.existsSync(banwordPath)) {
        this.banwords = JSON.parse(fs.readFileSync(banwordPath, "utf-8"));
        // Pre-compile regex for performance and escape special characters
        if (this.banwords.length > 0) {
          const escapedWords = this.banwords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          this.nsfwRegex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'i');
        }
      } else {
        this.banwords = [];
        this.nsfwRegex = null;
      }
    } catch (err) {
      console.error("Failed to load banword.json:", err);
      this.banwords = [];
      this.nsfwRegex = null;
    }
  }

  async start() {
    console.log("Initializing DSU Preview...");

    // 1. Initialize Database
    try {
      await db.init();
      console.log("Database initialized.");
    } catch (err) {
      console.error("Database failed to initialize:", err);
    }

    // 2. Load commands and events
    this.loadCommands();
    this.loadEvents();

    // 3. Deploy commands if requested
    if (config.deployCommands) {
      await this.deployCommands();
    }

    // 4. Setup Ready Event (Logic moved to src/events/ready.js)
    // this.once(Events.ClientReady, () => {
    //   console.log(`Logged in as ${this.user.tag}`);
    //   this.updateChecker.start();
    // });

    // 6. Handle Shutdown
    this.setupGracefulShutdown();

    // 7. Login
    try {
      await this.login(config.token);
    } catch (err) {
      if (err.message.includes("disallowed intents")) {
        console.error("\x1b[31m[CRITICAL] Failed to login: Disallowed Intents.\x1b[0m");
        console.error("\x1b[33mPlease ensure 'MESSAGE CONTENT INTENT' and 'SERVER MEMBERS INTENT' are enabled in the Discord Developer Portal.\x1b[0m");
      } else {
        console.error("Failed to login to Discord:", err);
      }
      process.exit(1);
    }
  }

  loadCommands() {
    const commandsPath = path.join(__dirname, "commands");
    const { commandsArray } = loadCommands(this, commandsPath);
    this.commandsArray = commandsArray;
    console.log(`Loaded ${this.commands.size} commands.`);
  }

  loadEvents() {
    const eventsPath = path.join(__dirname, "events");
    if (!fs.existsSync(eventsPath)) {
      console.warn("Events directory not found.");
      return;
    }
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((f) => f.endsWith(".js"));

    for (const file of eventFiles) {
      try {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
          this.once(event.name, (...args) => {
            try { event.execute(...args); } catch (err) { console.error(`[EVENT] Error in once event ${event.name}:`, err); }
          });
        } else {
          this.on(event.name, async (...args) => {
            try { await event.execute(...args); } catch (err) { console.error(`[EVENT] Error in event ${event.name}:`, err); }
          });
        }
      } catch (err) {
        console.warn(`[WARN] Failed to load event ${file}: ${err.message}`);
      }
    }
    console.log(`Loaded ${eventFiles.length} events.`);
  }

  async deployCommands() {
    const rest = new REST({ version: "10" }).setToken(config.token);
    try {
      console.log("Deploying slash commands...");
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: this.commandsArray,
      });
      console.log("Commands deployed.");
    } catch (error) {
      console.error("Deployment error:", error);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}, shutting down...`);
      this.updateChecker.stop();
      await db.shutdown();
      this.destroy();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }
}

module.exports = Bot;
