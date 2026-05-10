const { EmbedBuilder } = require("discord.js");
const { Colors } = require("./embeds.js");
const fs = require("fs");
const path = require("path");

// --- ANSI Colors for Terminal ---
const ANSI = {
  RESET: "\x1b[0m",
  BLUE: "\x1b[34m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  RED: "\x1b[31m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
};

/**
 * Global Logger Utility
 */
class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), "data", "logs");
    this.logFile = path.join(this.logDir, "bot.log");
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Appends log entry to file (Async)
   */
  async _toFile(level, message) {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-control-regex
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, ""); // Remove ANSI codes for file
    const logEntry = `[${timestamp}] [${level}] ${cleanMessage}\n`;

    try {
      await fs.promises.appendFile(this.logFile, logEntry);
    } catch (err) {
      // Don't use this.error here to avoid infinite loop
      process.stderr.write(`Failed to write to log file: ${err.message}\n`);
    }
  }

  _format(level, message, color) {
    const timestamp = new Date().toLocaleTimeString();
    const tag = `${color}[${level}]${ANSI.RESET}`;
    return `${ANSI.GRAY}[${timestamp}]${ANSI.RESET} ${tag} ${message}`;
  }

  info(message) {
    const msg = this._format("INFO", message, ANSI.BLUE);
    process.stdout.write(msg + "\n");
    this._toFile("INFO", message);
  }

  success(message) {
    const msg = this._format("SUCCESS", message, ANSI.GREEN);
    process.stdout.write(msg + "\n");
    this._toFile("SUCCESS", message);
  }

  warn(message) {
    const msg = this._format("WARN", message, ANSI.YELLOW);
    process.stdout.write(msg + "\n");
    this._toFile("WARN", message);
  }

  error(message, error = null) {
    let fullMsg = message;
    if (error) {
      fullMsg += `\n${error.stack || error}`;
    }
    const msg = this._format("ERROR", fullMsg, ANSI.RED);
    process.stderr.write(msg + "\n");
    this._toFile("ERROR", fullMsg);
  }

  cmd(user, commandName, channel, options = "") {
    const logStr = `${user.tag} (${user.id}) used /${commandName} in #${channel.name} ${options}`;
    const msg = this._format("CMD", logStr, ANSI.CYAN);
    process.stdout.write(msg + "\n");
    this._toFile("CMD", logStr);
  }

  debug(message) {
    if (process.env.DEBUG === "true") {
      const msg = this._format("DEBUG", message, ANSI.MAGENTA);
      process.stdout.write(msg + "\n");
      this._toFile("DEBUG", message);
    }
  }
}

const log = new Logger();

// --- Discord-specific Logging Functions (Keep for backward compatibility/Discord UI) ---

async function getLogChannel(guild, type = "mod") {
  const db = require("../db.js");
  const settings = await db.getSettings(guild.id);
  const conf = settings?.logs;

  if (!conf?.enabled || !conf.channel) return null;
  const categories =
    conf.categories instanceof Map
      ? Object.fromEntries(conf.categories.entries())
      : conf.categories?.toObject
        ? conf.categories.toObject()
        : conf.categories;
  if (type && categories && categories[type] === false) return null;

  const channel = guild.channels.cache.get(conf.channel);
  if (!channel) return null;

  const perms = channel.permissionsFor(guild.members.me);
  if (!perms?.has(["ViewChannel", "SendMessages", "EmbedLinks"])) return null;

  return channel;
}

async function logModerationAction(guild, user, action, reason, moderator) {
  const logChannel = await getLogChannel(guild, "mod");
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle(`Sanction: ${action}`)
    .addFields(
      { name: "Member", value: `**${user.tag}** (\`${user.id}\`)`, inline: true },
      {
        name: "Moderator",
        value: `**${moderator?.tag || "Automod"}**`,
        inline: true,
      },
      { name: "Reason", value: reason || "Not specified", inline: false },
    )
    .setColor(Colors.WARNING)
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    log.error(`Failed to send log to ${guild.name}:`, e);
  }
}

module.exports = { log, getLogChannel, logModerationAction };
