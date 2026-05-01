const Marriage = require("../../models/Marriage");

class MarriageService {
  async getMarriage(userId) {
    return Marriage.findOne({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      isDivorced: false,
    });
  }

  async createMarriage(user1Id, user2Id, proposerId, guildId) {
    return Marriage.create({ user1Id, user2Id, proposerId, guildId });
  }

  async divorce(userId) {
    return Marriage.updateOne(
      { $or: [{ user1Id: userId }, { user2Id: userId }], isDivorced: false },
      { $set: { isDivorced: true, divorceDate: new Date() } },
    );
  }

  async getMarriageStats() {
    const totalMarriages = await Marriage.countDocuments({ isDivorced: false });
    const totalDivorces = await Marriage.countDocuments({ isDivorced: true });
    return { totalMarriages, totalDivorces };
  }
}

module.exports = new MarriageService();
