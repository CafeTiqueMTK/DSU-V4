const { Events } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");
const { createLogEmbed, Colors } = require("../utils/embeds");

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    const guildId = message.guild.id;

    // --- 1. Ghost Ping Detection (Automod) ---
    try {
      const settings = await db.getSettings(guildId);
      const guildSettings = settings.automod;

      if (
        guildSettings?.enabled &&
        guildSettings.categories?.ghostPing?.enabled &&
        message.mentions?.users?.size > 0
      ) {
        const client = message.client;
        const member =
          message.member ||
          (await message.guild.members
            .fetch(message.author.id)
            .catch(() => null));

        const cooldownKey = `${guildId}:${message.author.id}`;
        const now = Date.now();
        if (!client.automodCooldown) client.automodCooldown = new Map();
        if (now - (client.automodCooldown.get(cooldownKey) || 0) >= 5000) {
          client.automodCooldown.set(cooldownKey, now);

          try {
            const dmEmbed = createLogEmbed(
              "⚠️ Warning - Violation Detected",
              `Hello ${message.author.username},\n\nYour message has been flagged: **Ghost Ping**\nReason: Thanks for respecting the server rules and avoiding ghost pings.`,
              Colors.WARNING,
              [],
              "🚨 Automod System"
            );
            await message.author.send({ embeds: [dmEmbed] }).catch(() => {});
          } catch {
            // Ignore DM errors
          }

          const actionChannelId = guildSettings.actionChannel;
          if (actionChannelId) {
            const notifChannel =
              message.guild.channels.cache.get(actionChannelId);
            if (notifChannel) {
              const ghostPingCat = guildSettings.categories.ghostPing;
              const embed = createLogEmbed(
                "🚨 Automod Action",
                null,
                Colors.AUTOMOD,
                [
                  {
                    name: "User",
                    value: `<@${message.author.id}>`,
                    inline: true,
                  },
                  {
                    name: "Sanction",
                    value: ghostPingCat.sanction || "None",
                    inline: true,
                  },
                  { name: "Reason", value: "Ghost ping", inline: false },
                ],
                "🚨 Automod System"
              );
              await notifChannel.send({ embeds: [embed] });
            }
          }

          const sanction = guildSettings.categories.ghostPing.sanction;
          if (sanction === "warn") {
            await message.channel?.send(
              `⚠️ <@${message.author.id}> has been warned for **Ghost ping**.`,
            );
            await db.addWarn(
              guildId,
              message.author.id,
              client.user.id,
              "Ghost ping",
            );
          } else if (sanction === "kick" && member) {
            await member.kick("Ghost ping");
          } else if (sanction === "ban" && member) {
            await member.ban({ reason: "Ghost ping" });
          }
        }
      }
    } catch (error) {
      console.error("Error in MessageDelete event:", error);
    }

    // --- 2. Message Logging ---
    try {
      const logChannel = await getLogChannel(message.guild, "messages");
      if (logChannel) {
        const embed = createLogEmbed(
          "🗑️ Message Deleted",
          null,
          Colors.WARNING,
          [
            {
              name: "Author",
              value: `${message.author.tag} (<@${message.author.id}>)`,
              inline: true,
            },
            {
              name: "Channel",
              value: `<#${message.channel.id}>`,
              inline: true,
            },
            {
              name: "Content",
              value: message.content || "No content (embed/attachment)",
              inline: false,
            },
          ],
          "ℹ️ Message Logger"
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      // Ignore logging errors
    }
  },
};
