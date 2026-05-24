const UserData = require("../../models/UserData");

class EconomyService {
  constructor(db) {
    this.db = db;
    this.xpBuffer = new Map(); // Buffer: userId -> { xp, coins }
    this.locks = new Map();
    this.flushInterval = setInterval(() => this.flushBuffer(), 60000); // Auto-flush every 60s
    this.maxBufferSize = 5000;
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

    if (this.xpBuffer.size > this.maxBufferSize) {
      console.warn(`[ECONOMY] XP buffer overflow: ${this.xpBuffer.size} entries. Check flush interval.`);
    }

    const dataToFlush = Array.from(this.xpBuffer.entries());
    this.xpBuffer.clear();

    const bulkOps = dataToFlush.map(([userId, stats]) => ({
      updateOne: {
        filter: { userId },
        update: { $inc: { "coins": stats.coins, "work.xp": stats.xp } },
        upsert: true
      }
    }));

    try {
      if (bulkOps.length > 0) {
        await UserData.bulkWrite(bulkOps);
      }
    } catch (err) {
      console.error("[ECONOMY] Failed to flush XP buffer:", err);
      for (const [userId, stats] of dataToFlush) {
        if (!this.xpBuffer.has(userId)) {
          this.xpBuffer.set(userId, stats);
        }
      }
    }
  }

  async _acquireLock(userId) {
    while (this.locks.has(userId)) {
      await this.locks.get(userId);
    }
    const promise = new Promise(resolve => {
      this.locks.set(userId, resolve);
    });
    return promise;
  }

  _releaseLock(userId) {
    const resolve = this.locks.get(userId);
    if (resolve) {
      this.locks.delete(userId);
      resolve();
    }
  }

  async getUserData(userId) {
    await this._acquireLock(userId);
    try {
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
    } finally {
      this._releaseLock(userId);
    }
  }

  async getCoins(userId) {
    await this._acquireLock(userId);
    try {
      const data = await UserData.findOne({ userId }, { coins: 1 }).lean();
      const buffered = this.xpBuffer.get(userId);
      return (data?.coins || 0) + (buffered?.coins || 0);
    } finally {
      this._releaseLock(userId);
    }
  }

  async saveCoins(userId, amount) {
    await this._acquireLock(userId);
    try {
      this.xpBuffer.delete(userId);
      return UserData.updateOne(
        { userId },
        { $set: { coins: Math.max(0, amount) } },
        { upsert: true },
      );
    } finally {
      this._releaseLock(userId);
    }
  }

  async saveXp(userId, xp) {
    await this._acquireLock(userId);
    try {
      const buffered = this.xpBuffer.get(userId);
      if (buffered) buffered.xp = 0;

      return UserData.updateOne(
        { userId },
        { $set: { "work.xp": Math.max(0, xp) } },
        { upsert: true }
      );
    } finally {
      this._releaseLock(userId);
    }
  }

  async addCoins(userId, amount) {
    await this._acquireLock(userId);
    try {
      const buffered = this.xpBuffer.get(userId) || { xp: 0, coins: 0 };
      buffered.coins += amount;
      this.xpBuffer.set(userId, buffered);
      const data = await UserData.findOne({ userId }, { coins: 1 }).lean();
      return (data?.coins || 0) + buffered.coins;
    } finally {
      this._releaseLock(userId);
    }
  }

  async getTopUsers(limit = 10) {
    // Note: Top users might be slightly outdated by the buffer, but it's acceptable
    return UserData.find({ coins: { $gt: 0 } }, { userId: 1, coins: 1 })
      .sort({ coins: -1 })
      .limit(limit)
      .lean();
  }

  async getWorkData(userId) {
    await this._acquireLock(userId);
    try {
      const data = await UserData.findOne({ userId }, { work: 1 }).lean();
      const buffered = this.xpBuffer.get(userId);
      if (buffered && data?.work) {
          data.work.xp += buffered.xp;
      }
      return data?.work || {};
    } finally {
      this._releaseLock(userId);
    }
  }

  async saveWorkData(userId, workData) {
    await this._acquireLock(userId);
    try {
      const buffered = this.xpBuffer.get(userId);
      if (buffered) buffered.xp = 0;

      return UserData.updateOne(
        { userId },
        { $set: { work: workData } },
        { upsert: true },
      );
    } finally {
      this._releaseLock(userId);
    }
  }

  async saveDailyData(userId, dailyData) {
    return UserData.updateOne(
      { userId },
      { $set: { daily: dailyData } },
      { upsert: true },
    );
  }

  async updateLeveling(userId, xpGain, coinsGain) {
    await this._acquireLock(userId);
    try {
      const buffered = this.xpBuffer.get(userId) || { xp: 0, coins: 0 };
      buffered.xp += xpGain;
      buffered.coins += coinsGain;
      this.xpBuffer.set(userId, buffered);

      const data = await UserData.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        { upsert: true, new: true, lean: true, setDefaultsOnInsert: true },
      );

      data.coins += buffered.coins;
      if (!data.work) data.work = { xp: 0 };
      data.work.xp += buffered.xp;

      return data;
    } finally {
      this._releaseLock(userId);
    }
  }
}

module.exports = EconomyService;
