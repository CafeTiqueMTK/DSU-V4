const { Events, EmbedBuilder } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const guild = member.guild;
    const guildId = guild.id;
    const settings = await db.getSettings(guildId);

    // --- 1. Autorole ---
    if (settings.autorole?.enabled && settings.autorole.roleId) {
      const role = guild.roles.cache.get(settings.autorole.roleId);
      if (role) await member.roles.add(role).catch(() => {});
    }

    // --- 2. Welcome & Logs ---
    if (settings.welcome?.enabled && settings.welcome.channel) {
      const channel = guild.channels.cache.get(settings.welcome.channel);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(`👋 Welcome ${member.user.username}!`)
          .setDescription(`Welcome to **${guild.name}**! 🎉`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setColor(0x00ff99)
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    const logChannel = await getLogChannel(guild, "arrived");
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`📝 Member Joined`)
        .setDescription(`**${member.user.tag}** joined.\nID: ${member.id}`)
        .setColor(0x0099ff)
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // --- 3. Anti-Raid ---
    if (settings.antiRaid?.enabled) {
      if (!this.recentJoins) this.recentJoins = new Map();
      const joins = this.recentJoins.get(guildId) || [];
      const now = Date.now();
      joins.push(now);
      const recent = joins.filter((t) => now - t < 10000);
      this.recentJoins.set(guildId, recent);

      if (recent.length >= (settings.antiRaid.threshold || 5)) {
        const amLog = await getLogChannel(guild, "automod");
        if (amLog)
          await amLog.send(
            "🚨 **RAID DETECTED!** Anti-raid protection active.",
          );
        await member.kick("Anti-raid protection").catch(() => {});
      }
    }

    // --- 4. Anti-Bot ---
    if (member.user.bot && settings.antiBot?.enabled) {
      await member.kick("Anti-bot protection").catch(() => {});
    }
  },
};
