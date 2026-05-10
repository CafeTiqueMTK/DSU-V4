const { Events } = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");
const { Colors, Emojis, createBaseEmbed } = require("../utils/embeds");

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
          const embed = createBaseEmbed(member.user, {
            title: `😢 ${member.user.username} left the server`,
            description: `We're sad to see you go! We hope to see you again on **${guild.name}**!`,
            thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
            color: Colors.ERROR,
          });
          await channel.send({ content: `Goodbye ${member.user.tag}...`, embeds: [embed] });
        }
      }

      const logChannel = await getLogChannel(guild, "farewell");
      if (logChannel) {
        const embed = createBaseEmbed(member.user, {
          title: `${Emojis.ERROR} Member Left`,
          description: `**${member.user.tag}** (\`${member.id}\`) has left the server.`,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          color: Colors.ERROR,
        })
        .addFields(
          { name: "📅 Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "📥 Final Count", value: guild.memberCount.toString(), inline: true }
        );
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in GuildMemberRemove event:", error);
    }
  },
};
