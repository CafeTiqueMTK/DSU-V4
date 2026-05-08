const { REST, Routes, Collection } = require("discord.js");
const path = require("path");
const { config, validateEnv } = require("../src/utils/env.js");
const { loadCommands } = require("../src/utils/commandLoader.js");

if (!validateEnv()) {
  console.error("Environment variables are missing.");
  process.exit(1);
}

const token = config.token;
const clientId = config.clientId;

const commandsPath = path.join(__dirname, "../src/commands");
const mockClient = { commands: new Collection() };

console.log("Loading commands for deployment...");
const { commandsArray } = loadCommands(mockClient, commandsPath);

if (commandsArray.length === 0) {
  console.log("No commands found to deploy.");
  process.exit(0);
}

console.log(`Loaded ${commandsArray.length} commands. Deploying...`);

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commandsArray,
    });
    console.log(`Successfully deployed ${data.length} application commands.`);
  } catch (error) {
    console.error("Failed to deploy commands:", error);
    process.exit(1);
  }
})();
