const { Events, EmbedBuilder } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const guild = member.guild;
    const guildId = guild.id;

    // --- 1. Farewell message ---
    try {
      const settings = await db.getSettings(guildId);
      const farewellConf = settings.farewell;
      if (farewellConf?.enabled && farewellConf.channel) {
        const channel = guild.channels.cache.get(farewellConf.channel);
        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle(`😢 ${member.user.username} left the server`)
            .setDescription(`We hope to see you again on **${guild.name}**...`)
            .setImage(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(0xff5555)
            .setFooter({ text: `User ID: ${member.id}` })
            .setTimestamp(new Date());
          await channel.send({ embeds: [embed] });
        }
      }

      // Farewell log
      const logChannel = await getLogChannel(guild, "farewell");
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`🗑️ Log: Member Left`)
          .setDescription(
            `A user has left the server:\n• Tag: **${member.user.tag}**\n• ID: ${member.id}\n• Account created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
          )
          .setImage(member.user.displayAvatarURL({ dynamic: true }))
          .setColor(0xff5555)
          .setFooter({ text: `Left ${guild.name}` })
          .setTimestamp(new Date());
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in GuildMemberRemove event:", error);
    }
  },
};
