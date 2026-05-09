const { EmbedBuilder } = require("discord.js");
const UserData = require("../../models/UserData");
const { Colors, Emojis } = require("../../utils/embeds");

class ModerationService {
  constructor(db) {
    this.db = db;
  }

  async getWarns(guildId, userId) {
    const data = await UserData.findOne(
      { userId },
      { warns: 1 }
    ).lean();
    if (!data || !data.warns) return [];
    return data.warns.filter((warning) => warning.guildId === guildId);
  }

  async addWarn(guildId, userId, moderatorId, reason) {
    return UserData.findOneAndUpdate(
      { userId },
      {
        $push: {
          warns: {
            $each: [{ guildId, moderatorId, reason, timestamp: new Date() }],
            $slice: -200 // Keep last 200 warns across all guilds (Safety fix)
          },
        },
      },
      { upsert: true, new: true },
    );
  }

  async clearWarns(guildId, userId) {
    return UserData.updateOne({ userId }, { $pull: { warns: { guildId } } });
  }

  async setUserFrozen(userId, frozen) {
    return UserData.updateOne(
      { userId },
      { $set: { frozen } },
      { upsert: true },
    );
  }

  async logModAction(guild, userTag, action, reason, moderator, extra = []) {
    const settings = await this.db.getSettings(guild.id);
    const conf = settings.logs;

    if (conf?.enabled && conf.channel) {
      const categories = conf.categories instanceof Map ? conf.categories : new Map(Object.entries(conf.categories || {}));
      if (categories.get("mod")) {
        const logChannel = guild.channels.cache.get(conf.channel);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle(`${Emojis.MOD} Moderation: ${action}`)
            .addFields(
              { name: "👤 User", value: `**${userTag}**`, inline: true },
              { name: "🛡️ Moderator", value: typeof moderator === 'string' ? `**${moderator}**` : `**${moderator.tag}**`, inline: true },
              { name: "📝 Reason", value: reason || "No reason specified" },
              ...extra,
            )
            .setColor(Colors.MODERATION)
            .setTimestamp();
          await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  }
}

module.exports = ModerationService;
