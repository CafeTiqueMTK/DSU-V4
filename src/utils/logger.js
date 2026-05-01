const { EmbedBuilder } = require("discord.js");
const db = require("../db.js");

async function getLogChannel(guild, type = "mod") {
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
    .setTitle(`⚠️ Sanction: ${action}`)
    .addFields(
      { name: "Member", value: `${user.tag} (${user.id})`, inline: true },
      {
        name: "Moderator",
        value: `${moderator?.tag || "Automod"}`,
        inline: true,
      },
      { name: "Reason", value: reason || "Not specified", inline: false },
    )
    .setColor(0xffa500)
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.warn(`[WARN] Failed to send log to ${guild.name}:`, e.message);
  }
}

module.exports = { getLogChannel, logModerationAction };
