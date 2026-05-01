const UserData = require("../../models/UserData");

class ModerationService {
  async getWarns(guildId, userId) {
    const data = await UserData.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return data.warns.filter((warning) => warning.guildId === guildId);
  }

  async addWarn(guildId, userId, moderatorId, reason) {
    return UserData.findOneAndUpdate(
      { userId },
      {
        $push: {
          warns: { guildId, moderatorId, reason, timestamp: new Date() },
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
}

module.exports = new ModerationService();
