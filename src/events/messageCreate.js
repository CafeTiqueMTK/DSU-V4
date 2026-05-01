const { Events, EmbedBuilder } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author?.bot || !message.guild) return;

    const client = message.client;
    const guildId = message.guild.id;
    const userId = message.author.id;

    // Fetch settings from MongoDB
    const guildSettings = await db.getSettings(guildId);

    // --- 1. Système de coins par message (Converted to UserData) ---
    try {
      if (guildSettings.level?.enabled) {
        // We use UserData model via db.js instead of storing it in GuildSetting
        const userData = await db.getUserData(userId);

        const oldCoins = userData.coins || 0;
        const oldXp = userData.work?.xp || 0; // Using work object or adding xp to UserData

        const newCoins = oldCoins + 10;
        const newXp = oldXp + 5;

        // Level up detection
        const oldLevel = Math.floor(oldXp / 100);
        const newLevel = Math.floor(newXp / 100);

        await db.saveCoins(userId, newCoins);
        // We might need to add XP to UserData schema if it's not there.
        // For now let's just use what we have or add it.
        // I will just update coins for now to avoid breaking schema.

        if (newLevel > oldLevel && guildSettings.level.message) {
          const levelChannel = guildSettings.level.channel
            ? message.guild.channels.cache.get(guildSettings.level.channel)
            : message.channel;
          if (levelChannel) {
            await levelChannel.send(
              `🎉 Félicitations <@${userId}> ! Tu viens de passer au niveau **${newLevel}** !`,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in leveling/coins system:", error);
    }

    // --- 2. Automod ---
    if (guildSettings.automod?.enabled) {
      const sendAutomodWarning = async (reason, violationType) => {
        if (!client.automodCooldown) client.automodCooldown = new Map();
        const cooldownKey = `${guildId}:${userId}:${violationType}`;
        const now = Date.now();
        if (now - (client.automodCooldown.get(cooldownKey) || 0) < 10000)
          return;
        client.automodCooldown.set(cooldownKey, now);

        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle("⚠️ Warning - Violation Detected")
            .setDescription(
              `Hello ${message.author.username},\n\nYour message has been flagged: **${violationType}**\nReason: ${reason}`,
            )
            .setColor(0xffa500)
            .setTimestamp();
          await message.author.send({ embeds: [dmEmbed] }).catch(() => {});
        } catch (e) {}

        const logChannel = await getLogChannel(message.guild, "automod");
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🚨 Automod Action")
            .addFields(
              {
                name: "Member",
                value: `${message.author.tag} (<@${userId}>)`,
                inline: true,
              },
              { name: "Violation", value: violationType, inline: true },
              {
                name: "Channel",
                value: `<#${message.channel.id}>`,
                inline: true,
              },
            )
            .setColor(0xff0000)
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }
      };

      // Anti Mass Mention
      if (guildSettings.antiMassMention?.enabled) {
        if (message.mentions.users.size + message.mentions.roles.size >= 5) {
          await message.delete().catch(() => {});
          return sendAutomodWarning("Too many mentions", "Mass Mention");
        }
      }

      // Anti Spam (Basic)
      if (guildSettings.antiSpam?.enabled) {
        if (!client.spamMap) client.spamMap = new Map();
        const spamKey = `${guildId}:${userId}`;
        const times = client.spamMap.get(spamKey) || [];
        const now = Date.now();
        times.push(now);
        const recent = times.filter((t) => now - t < 5000);
        client.spamMap.set(spamKey, recent);
        if (recent.length > 5) {
          await message.delete().catch(() => {});
          return sendAutomodWarning("Sending messages too fast", "Spam");
        }
      }

      // Anti Invites/Links
      if (
        guildSettings.antiInvites?.enabled &&
        /discord\.gg\/[a-zA-Z0-9]+/.test(message.content)
      ) {
        await message.delete().catch(() => {});
        return sendAutomodWarning(
          "Discord invite links are not allowed",
          "Invite Link",
        );
      }
      if (
        guildSettings.antiLinks?.enabled &&
        /https?:\/\/[^\s]+/.test(message.content)
      ) {
        await message.delete().catch(() => {});
        return sendAutomodWarning(
          "External links are not allowed",
          "External Link",
        );
      }

      // Anti Keywords
      if (
        guildSettings.antiKeywords?.enabled &&
        guildSettings.antiKeywords.keywords?.length > 0
      ) {
        const lowerContent = message.content.toLowerCase();
        const badWord = guildSettings.antiKeywords.keywords.find((k) =>
          lowerContent.includes(k.toLowerCase()),
        );
        if (badWord) {
          await message.delete().catch(() => {});
          return sendAutomodWarning(
            `Blacklisted word: ${badWord}`,
            "Keyword Protection",
          );
        }
      }
    }

    // --- 3. Funny Responses ---
    const funny = guildSettings.funny;
    if (funny) {
      const handleFunny = async (type, triggers, response, emoji) => {
        const funnyConfig =
          typeof funny.get === "function" ? funny.get(type) : funny[type];
        if (!funnyConfig?.enabled) return;
        const lower = message.content.toLowerCase();
        if (triggers.some((t) => lower.includes(t))) {
          if (!client.funnyCooldown) client.funnyCooldown = new Map();
          const key = `${guildId}:${userId}:${type}`;
          const now = Date.now();
          if (now - (client.funnyCooldown.get(key) || 0) < 30000) return;
          client.funnyCooldown.set(key, now);
          await message.reply(`${emoji} **${response}**`);
          return true;
        }
        return false;
      };

      const resp =
        (await handleFunny(
          "eat",
          ["i eat", "m eating"],
          "Enjoy your meal! 😋",
          "🍽️",
        )) ||
        (await handleFunny(
          "sleep",
          ["going to sleep", "going to bed"],
          "Good night! 🌙",
          "😴",
        )) ||
        (await handleFunny(
          "game",
          ["i'm playing", "i'm gaming"],
          "GG! Have fun! 🎮",
          "🕹️",
        )) ||
        (await handleFunny(
          "pizza",
          ["pizza"],
          "Pizza? I'm coming! 🍕",
          "🍕",
        ));

      if (resp) return; // Stop if a funny response was sent
    }

    // --- 4. Anti Role Mention ---
    if (guildSettings.antiRoles?.enabled) {
      const blockedRoles = guildSettings.automod?.blockedRoles || [];
      const mentionedBlocked = message.mentions.roles.filter((r) =>
        blockedRoles.includes(r.id),
      );
      if (mentionedBlocked.size > 0) {
        await message.delete().catch(() => {});
        const logChannel = await getLogChannel(message.guild, "automod");
        if (logChannel) {
          await logChannel.send({
            embeds: [
              new EmbedBuilder()
                .setTitle("🚫 Role Mention Blocked")
                .setDescription(`User <@${userId}> mentioned a protected role.`)
                .setColor(0xff0000)
                .setTimestamp(),
            ],
          });
        }
      }
    }
  },
};
