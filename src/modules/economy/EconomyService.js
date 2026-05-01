const UserData = require("../../models/UserData");

class EconomyService {
  async getUserData(userId) {
    return UserData.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async getCoins(userId) {
    const data = await this.getUserData(userId);
    return data.coins;
  }

  async saveCoins(userId, amount) {
    return UserData.updateOne(
      { userId },
      { $set: { coins: Math.max(0, amount) } },
      { upsert: true },
    );
  }

  async addCoins(userId, amount) {
    const result = await UserData.findOneAndUpdate(
      { userId },
      { $inc: { coins: amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (result.coins < 0) {
      result.coins = 0;
      await result.save();
    }
    return result.coins;
  }

  async getTopUsers(limit = 10) {
    return UserData.find({ coins: { $gt: 0 } })
      .sort({ coins: -1 })
      .limit(limit)
      .lean();
  }

  async getWorkData(userId) {
    const data = await this.getUserData(userId);
    return data.work;
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
}

module.exports = new EconomyService();
