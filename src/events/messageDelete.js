const { Events, EmbedBuilder } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");

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
        guildSettings.categories?.get("ghostPing")?.enabled &&
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
            await message.author.send({
              embeds: [
                {
                  title: "Sanction Automod",
                  description: `Tu as été sanctionné pour : **Ghost ping**\nMerci de respecter les règles du serveur.`,
                  color: 0xff0000,
                },
              ],
            });
          } catch {}

          const actionChannelId = guildSettings.actionChannel;
          if (actionChannelId) {
            const notifChannel =
              message.guild.channels.cache.get(actionChannelId);
            if (notifChannel) {
              const ghostPingCat = guildSettings.categories.get("ghostPing");
              const embed = new EmbedBuilder()
                .setTitle("🚨 Automod Action")
                .addFields(
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
                )
                .setColor(0xff0000)
                .setTimestamp(new Date());
              await notifChannel.send({ embeds: [embed] });
            }
          }

          const sanction = guildSettings.categories.get("ghostPing").sanction;
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
        const embed = new EmbedBuilder()
          .setTitle("🗑️ Message Deleted")
          .addFields(
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
          )
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setColor(0xff5555)
          .setFooter({ text: "DSU Message Logger" })
          .setTimestamp(new Date());
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {}
  },
};
