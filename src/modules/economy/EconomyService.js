const UserData = require("../../models/UserData");

class EconomyService {
  constructor(db) {
    this.db = db;
    this.xpBuffer = new Map(); // Buffer: userId -> { xp, coins }
    this.flushInterval = setInterval(() => this.flushBuffer(), 60000); // Auto-flush every 60s
  }

  /**
   * Cleans up resources on shutdown
   */
  async shutdown() {
    clearInterval(this.flushInterval);
    await this.flushBuffer();
  }

  /**
   * Persists accumulated XP/Coins to database
   */
  async flushBuffer() {
    if (this.xpBuffer.size === 0) return;

    const dataToFlush = Array.from(this.xpBuffer.entries());
    this.xpBuffer.clear();

    const UserData = require("../../models/UserData");
    const bulkOps = dataToFlush.map(([userId, stats]) => ({
      updateOne: {
        filter: { userId },
        update: {
          $inc: {
            "coins": stats.coins,
            "work.xp": stats.xp
          }
        },
        upsert: true
      }
    }));

    try {
      if (bulkOps.length > 0) {
        await UserData.bulkWrite(bulkOps);
        // console.log(`[ECONOMY] Flushed ${bulkOps.length} users' XP/Coins to DB.`);
      }
    } catch (err) {
      console.error("[ECONOMY] Failed to flush XP buffer:", err);
      // Optional: Re-insert data back to buffer if needed, but risky for infinite loops
    }
  }

  async getUserData(userId) {
    // Merge DB data with buffer data for accurate real-time view
    const data = await UserData.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, lean: true, setDefaultsOnInsert: true },
    );

    const buffered = this.xpBuffer.get(userId);
    if (buffered) {
      data.coins += buffered.coins;
      if (!data.work) data.work = { xp: 0 };
      data.work.xp += buffered.xp;
    }

    return data;
  }

  async getCoins(userId) {
    const data = await UserData.findOne({ userId }, { coins: 1 }).lean();
    const buffered = this.xpBuffer.get(userId);
    return (data?.coins || 0) + (buffered?.coins || 0);
  }

  async saveCoins(userId, amount) {
    // If we're setting an absolute amount, we should clear the buffer for this user
    this.xpBuffer.delete(userId);
    return UserData.updateOne(
      { userId },
      { $set: { coins: Math.max(0, amount) } },
      { upsert: true },
    );
  }

  async saveXp(userId, xp) {
    // Clear buffered XP gain when setting absolute XP
    const buffered = this.xpBuffer.get(userId);
    if (buffered) buffered.xp = 0;

    return UserData.updateOne(
      { userId },
      { $set: { "work.xp": Math.max(0, xp) } },
      { upsert: true }
    );
  }

  async addCoins(userId, amount) {
    // For immediate additions (like commands), we still use atomic DB updates
    // or we could add to buffer. Let's add to buffer for consistency and performance.
    const buffered = this.xpBuffer.get(userId) || { xp: 0, coins: 0 };
    buffered.coins += amount;
    this.xpBuffer.set(userId, buffered);
    return this.getCoins(userId);
  }

  async getTopUsers(limit = 10) {
    // Note: Top users might be slightly outdated by the buffer, but it's acceptable
    return UserData.find({ coins: { $gt: 0 } }, { userId: 1, coins: 1 })
      .sort({ coins: -1 })
      .limit(limit)
      .lean();
  }

  async getWorkData(userId) {
    const data = await UserData.findOne({ userId }, { work: 1 }).lean();
    const buffered = this.xpBuffer.get(userId);
    if (buffered && data?.work) {
        data.work.xp += buffered.xp;
    }
    return data?.work || {};
  }

  async saveWorkData(userId, workData) {
    // If setting work data, we should be careful with buffered XP
    const buffered = this.xpBuffer.get(userId);
    if (buffered) buffered.xp = 0;

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
    // THE OPTIMIZATION: Just update the buffer
    const buffered = this.xpBuffer.get(userId) || { xp: 0, coins: 0 };
    buffered.xp += xpGain;
    buffered.coins += coinsGain;
    this.xpBuffer.set(userId, buffered);

    // Return current (approximated) data for level-up checks
    return this.getUserData(userId);
  }
}

module.exports = EconomyService;
