const { EmbedBuilder } = require("discord.js");

/**
 * Standard colors for the bot's embeds.
 */
const Colors = {
  INFO: 0x3498db,       // Blue
  SUCCESS: 0x2ecc71,    // Green
  ERROR: 0xe74c3c,      // Red
  WARNING: 0xf1c40f,    // Yellow
  ECONOMY: 0xf1c40f,    // Gold
  MODERATION: 0x2c3e50, // Dark blue/grey
  AUTOMOD: 0xff0000,    // Red (Authority)
  TICKETS: 0x3498db,    // Blue
  FUN: 0x9b59b6,        // Purple
  ADMIN: 0x34495e,      // Darker grey
  NEUTRAL: 0x95a5a6,    // Grey
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
 * Creates an error embed.
 */
function error(user, description, title = "Error", moduleName = null) {
  return createBaseEmbed(user, {
    title: `${Emojis.ERROR} ${title}`,
    description,
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

module.exports = {
  Colors,
  Emojis,
  createBaseEmbed,
  createLogEmbed,
  success,
  error,
  info,
};

