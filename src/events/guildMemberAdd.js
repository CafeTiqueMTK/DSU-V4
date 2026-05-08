const { Events, EmbedBuilder } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");
const { Colors, Emojis, createBaseEmbed } = require("../utils/embeds");

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
          .setTitle(`👋 Welcome to the family, ${member.user.username}!`)
          .setDescription(`We're glad to have you here at **${guild.name}**! 🎉\nYou are our **${guild.memberCount}th** member!`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setColor(Colors.SUCCESS)
          .setTimestamp();
        await channel.send({ content: `Hey ${member}! Welcome!`, embeds: [embed] }).catch(() => {});
      }
    }

    const logChannel = await getLogChannel(guild, "arrived");
    if (logChannel) {
      const embed = createBaseEmbed(member.user, {
        title: `${Emojis.USER} Member Joined`,
        description: `**${member.user.tag}** (\`${member.id}\`) has joined the server.`,
        color: Colors.SUCCESS,
      })
      .addFields(
        { name: "📅 Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "📥 Member Count", value: guild.memberCount.toString(), inline: true }
      );
      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // --- 3. Anti-Raid & Lockdown ---
    if (settings.antiRaid?.enabled) {
      if (!this.recentJoins) this.recentJoins = new Map();
      if (!this.recentMembers) this.recentMembers = new Map();
      
      const guildJoins = this.recentJoins.get(guildId) || [];
      const guildMembers = this.recentMembers.get(guildId) || [];
      const now = Date.now();
      
      guildJoins.push(now);
      guildMembers.push(member);
      
      // Keep only joins from the last 10 seconds
      const recentJoins = guildJoins.filter((t) => now - t < 10000);
      const recentMembers = guildMembers.filter((m) => {
          try { return (now - m.joinedTimestamp) < 10000; } catch { return false; }
      });
      
      this.recentJoins.set(guildId, recentJoins);
      this.recentMembers.set(guildId, recentMembers);

      // If already in active lockdown, kick immediately
      if (settings.antiRaid.active) {
        await member.kick("Server Lockdown Active").catch(() => {});
        return;
      }

      // If raid threshold reached
      if (recentJoins.length >= (settings.antiRaid.threshold || 5)) {
        const amLog = await getLogChannel(guild, "automod");
        
        // 1. Activate Lockdown status
        await db.updateSettings(guildId, { "antiRaid.active": true });

        // 2. Clear out all users/bots who participated in the raid window
        for (const m of recentMembers) {
            await m.kick("Raid Participation / Mass Join").catch(() => {});
        }
        // Clear local cache for this guild to prevent double processing
        this.recentJoins.set(guildId, []);
        this.recentMembers.set(guildId, []);

        // 3. Lock the server channels if configured
        if (settings.antiRaid.lockdown) {
          const everyone = guild.roles.everyone;
          guild.channels.cache.forEach(async (channel) => {
            if (channel.isTextBased() && channel.permissionsFor(everyone).has("SendMessages")) {
              await channel.permissionOverwrites.edit(everyone, { SendMessages: false }, { reason: "Automatic Raid Lockdown" }).catch(() => {});
            }
          });
        }

        if (amLog) {
            await amLog.send(`🚨 **RAID DETECTED!** (${recentJoins.length} joins in 10s)\n🧹 **Action:** Kicked all recent participants.\n🔒 **Status:** Server is now in **LOCKDOWN** mode.`);
        }
      }
    }

    // --- 4. Anti-Bot ---
    if (member.user.bot && settings.antiBot?.enabled) {
      await member.kick("Anti-bot protection").catch(() => {});
    }
  },
};
