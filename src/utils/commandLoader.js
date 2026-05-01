const fs = require("fs");
const path = require("path");

function getCommandFiles(commandsPath) {
  if (!fs.existsSync(commandsPath)) return [];

  const entries = fs.readdirSync(commandsPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(commandsPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getCommandFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function loadCommands(client, commandsPath, options = {}) {
  const { clearCache = false } = options;
  const commandFiles = getCommandFiles(commandsPath);
  const commandsArray = [];

  for (const filePath of commandFiles) {
    try {
      if (clearCache) delete require.cache[require.resolve(filePath)];
      const exported = require(filePath);

      // Handle both single command and array of commands
      const commands = Array.isArray(exported) ? exported : [exported];

      for (const command of commands) {
        if (!command?.data?.name || typeof command.execute !== "function") {
          console.warn(`[WARN] Invalid command export in: ${filePath}`);
          continue;
        }

        if (client.commands.has(command.data.name)) {
          console.warn(
            `[WARN] Duplicate command name skipped: ${command.data.name}`,
          );
          continue;
        }

        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
      }
    } catch (error) {
      console.warn(
        `[WARN] Failed to load command(s) from ${filePath}: ${error.message}`,
      );
    }
  }

  return { commandsArray, commandFiles };
}

module.exports = {
  getCommandFiles,
  loadCommands,
};
