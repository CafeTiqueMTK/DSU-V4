const UserData = require("../../models/UserData");

class EconomyService {
  constructor(db) {
    this.db = db;
  }

  async getUserData(userId) {
    return UserData.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async getCoins(userId) {
    const data = await UserData.findOne({ userId }, { coins: 1 }).lean();
    return data?.coins || 0;
  }

  async saveCoins(userId, amount) {
    return UserData.updateOne(
      { userId },
      { $set: { coins: Math.max(0, amount) } },
      { upsert: true },
    );
  }

  async saveXp(userId, xp) {
    return UserData.updateOne(
      { userId },
      { $set: { "work.xp": Math.max(0, xp) } },
      { upsert: true }
    );
  }

  async addCoins(userId, amount) {
    // Atomic update with floor to 0 using aggregation pipeline (High Severity Fix)
    const result = await UserData.findOneAndUpdate(
      { userId },
      [
        { $set: { coins: { $max: [{ $add: [{ $ifNull: ["$coins", 0] }, amount] }, 0] } } }
      ],
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return result.coins;
  }

  async getTopUsers(limit = 10) {
    return UserData.find({ coins: { $gt: 0 } }, { userId: 1, coins: 1 })
      .sort({ coins: -1 })
      .limit(limit)
      .lean();
  }

  async getWorkData(userId) {
    const data = await UserData.findOne({ userId }, { work: 1 }).lean();
    return data?.work || {};
  }

  async saveWorkData(userId, workData) {
    return UserData.updateOne(
      { userId },
      { $set: { work: workData } },
      { upsert: true },
    );
  }

  async saveDailyData(userId, dailyData) {
    return UserData.updateOne(
      { userId },
      { $set: { daily: dailyData } },
      { upsert: true },
    );
  }

  async updateLeveling(userId, xpGain, coinsGain) {
    return UserData.findOneAndUpdate(
      { userId },
      {
        $inc: {
          "coins": coinsGain,
          "work.xp": xpGain
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

module.exports = EconomyService;
