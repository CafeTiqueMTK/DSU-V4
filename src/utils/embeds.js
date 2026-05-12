const { EmbedBuilder } = require("discord.js");

/**
 * Standard colors for the bot's embeds.
 */
const Colors = {
  // Positive / Success
  SUCCESS: 0x2ecc71,    // Green (Success, Deban, Demute)

  // Neutral / Info
  INFO: 0x3498db,       // Blue
  NEUTRAL: 0x95a5a6,    // Grey

  // Warnings / Minor Errors
  WARNING: 0xf1c40f,    // Yellow (Warn)
  NON_FATAL: 0xe67e22,  // Orange (Mute, Kick, Non-fatal error)

  // Critical / Negative
  ERROR: 0xe74c3c,      // Red (Critical error)
  BAN: 0xc0392b,        // Dark Red (Ban)

  // Module Specific (Fallback to palette if needed)
  ECONOMY: 0xf1c40f,    // Gold
  TICKETS: 0x3498db,    // Blue
  FUN: 0x9b59b6,        // Purple
};

/**
 * Standard emojis for the bot's embeds.
 */
const Emojis = {
  INFO: "ℹ️",
  SUCCESS: "✅",
  ERROR: "❌",
  WARNING: "⚠️",
  COIN: "🪙",
  WORK: "💼",
  RANK: "🏆",
  USER: "👤",
  SERVER: "🏰",
  BOT: "🤖",
  ADMIN: "🛡️",
  MOD: "🔨",
  AUTOMOD: "🚨",
  TICKET: "🎫",
  LOCK: "🔒",
  UNLOCK: "🔓",
  HEART: "❤️",
  HUG: "🤗",
  MARRY: "💍",
  ARROW: "➡️",
  BULLET: "•",
};

/**
 * Creates a base embed with standard footer and timestamp.
 * @param {import("discord.js").User} user The user who requested the command.
 * @param {Object} options Options for the embed.
 * @returns {EmbedBuilder}
 */
function createBaseEmbed(user, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || Colors.INFO)
    .setTimestamp()
    .setFooter({
      text: `Requested by ${user.tag}`,
      iconURL: user.displayAvatarURL({ dynamic: true }),
    });

  if (options.module) {
    embed.setAuthor({ name: options.module });
  }

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);

  return embed;
}

/**
 * Creates a success embed.
 */
function success(user, description, title = "Success", moduleName = null) {
  return createBaseEmbed(user, {
    title: `${Emojis.SUCCESS} ${title}`,
    description,
    color: Colors.SUCCESS,
    module: moduleName
  });
}

/**
 * Generates a joke based on failure percentage.
 * @returns {string}
 */
function getFailureJoke() {
  const jokes = [
    { threshold: 90, text: "Even my source code felt that one. 🤕" },
    { threshold: 75, text: "This wasn't supposed to happen, but let's call it a feature. 🤡" },
    { threshold: 50, text: "Error 404: My talent was not found. 💨" },
    { threshold: 25, text: "I tried to be smart, but my processor said no. 🧠🚫" },
    { threshold: 10, text: "Oops. This is awkward. 😅" },
    { threshold: 0, text: "Just a glitch in the matrix. 🌌" }
  ];

  const roll = Math.floor(Math.random() * 100);
  const joke = jokes.find(j => roll >= j.threshold);
  return `${joke.text} (${roll}% chance of critical failure)`;
}

/**
 * Creates an error embed.
 */
function error(user, description, title = "Error", moduleName = null) {
  return createBaseEmbed(user, {
    title: `${Emojis.ERROR} ${title}`,
    description: `${description}\n\n*${getFailureJoke()}*`,
    color: Colors.ERROR,
    module: moduleName
  });
}

/**
 * Creates an info embed.
 */
function info(user, description, title = "Information", moduleName = null) {
  return createBaseEmbed(user, {
    title: `${Emojis.INFO} ${title}`,
    description,
    color: Colors.INFO,
    module: moduleName
  });
}

/**
 * Creates a log embed for system/internal logs.
 * @param {string} title Log title
 * @param {string} description Log description
 * @param {number} color Log color
 * @param {Array} fields Log fields
 * @param {string} moduleName Module name (e.g. "Automod System")
 * @returns {EmbedBuilder}
 */
function createLogEmbed(title, description, color = Colors.INFO, fields = [], moduleName = null) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp();

  if (description) embed.setDescription(description);
  if (moduleName) embed.setAuthor({ name: moduleName });
  if (fields && fields.length > 0) embed.addFields(fields);

  return embed;
}

/**
 * Creates a critical bot failure embed (Bright Red).
 * M-3 Fix: Do not leak raw error messages to users.
 */
function botFailure(errorType, details = "") {
  return new EmbedBuilder()
    .setTitle("⚠️ PARTIAL FAILURE")
    .setDescription(`**Warning:** ${errorType}\n${details ? `\n${details}\n` : ""}\n*${getFailureJoke()}*`)
    .setColor(0xe67e22) // ORANGE (Partial failure is less severe than total)
    .addFields({ name: "🛡️ Stability System", value: "The Core remains active. Only this module is affected." })
    .setTimestamp();
}

/**
 * Creates a database offline warning embed (Orange).
 */
function dbOffline(user, featureName) {
  return createBaseEmbed(user, {
    title: "📴 Database Offline",
    description: `The **${featureName}** feature is currently unavailable because the database is offline.\n\nResults cannot be saved or retrieved at this time.`,
    color: 0xe67e22, // ORANGE
    module: "⚙️ System Degradation"
  });
}

module.exports = {
  Colors,
  Emojis,
  createBaseEmbed,
  createLogEmbed,
  success,
  error,
  info,
  botFailure,
  dbOffline,
};

