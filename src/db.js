const mongoose = require("mongoose");
const { config } = require("./utils/env.js");
const GuildSetting = require("./models/GuildSetting.js");
const { log } = require("./utils/logger");

class Database {
  constructor() {
    this.isReady = false;
    this.guildSettingsCache = new Map();
    this.legacyStores = new Map();

    // Instantiate services with 'this' reference to avoid circular requires
    const EconomyService = require("./modules/economy/EconomyService");
    const ModerationService = require("./modules/moderation/ModerationService");
    const MarriageService = require("./modules/marriage/MarriageService");
    const TicketService = require("./modules/tickets/TicketService");

    this.economy = new EconomyService(this);
    this.moderation = new ModerationService(this);
    this.marriage = new MarriageService(this);
    this.tickets = new TicketService(this);
  }

  async init() {
    if (this.isReady) return;
    if (!config.mongoUri) {
      log.error("MONGODB_URI is not defined in environment variables.");
      if (config.production) throw new Error("MongoDB URI is required in production.");
      log.warn("Running in DEV mode without database functionality.");
      return;
    }

    try {
      mongoose.set("strictQuery", false);
      // Add a connection timeout for faster startup in dev if DB is down
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: config.production ? 30000 : 5000,
      });
      this.isReady = true;
      await this.loadGuildSettingsCache();
      log.success("Connected to MongoDB.");
    } catch (error) {
      if (config.production) {
        log.error("CRITICAL: Could not connect to MongoDB in production.", error);
        throw error;
      }
      log.warn(`⚠️ Database connection failed: ${error.message}. Running in DEGRADED mode.`);
      this.isReady = false;
    }
  }

  async shutdown() {
    if (!this.isReady) return;
    await mongoose.disconnect();
    this.isReady = false;
    log.info("Disconnected from MongoDB.");
  }


  // --- Guild Settings Logic (To be moved to a SettingsService later) ---

  getDefaultSettings() {
    return {
      automod: {
        enabled: false,
        actionChannel: null,
        categories: {
          badWords: { enabled: false },
          discordLink: { enabled: false },
          ghostPing: { enabled: false },
          spam: { enabled: false },
          invisibleChars: { enabled: false },
        },
        blockedRoles: [],
        safeChannels: [],
      },
      logs: {
        enabled: false,
        channel: null,
        categories: {
          arrived: true,
          farewell: true,
          vocal: true,
          mod: true,
          automod: true,
          commands: true,
          roles: true,
          soundboard: true,
          tickets: true,
          channels: true,
          economy: true,
          bulkdelete: true,
          messages: true,
          invites: true,
        },
      },
      level: {
        enabled: false,
        channel: null,
        boosters: {},
        users: {},
        message: true,
      },
      streak: {
        enabled: true,
        users: {},
        boosters: {},
      },
      welcome: { enabled: false, channel: null },
      farewell: { enabled: false, channel: null },
      autorole: { enabled: false, roleId: null },
      funny: {},
      antiBot: { enabled: false },
      antiRaid: { enabled: false, threshold: 5, lockdown: false, active: false },
      antiMassMention: { enabled: false },
      antiSpam: { enabled: false },
      antiInvites: { enabled: false },
      antiLinks: { enabled: false },
      antiRoles: { enabled: false },
      antiKeywords: { enabled: false, keywords: [] },
      antiNsfw: { enabled: false },
      tickets: {
        setup: false,
        supportRole: null,
        ticketsCategory: null,
        welcomeMessage:
          "Welcome to your ticket! A support member will assist you soon.",
        ticketPrefix: "ticket",
        activeTickets: {},
      },
      reactionRoles: {},
      updates: {},
      warnActions: {},
      moderatorRole: null,
    };
  }

  toPlainObject(value) {
    if (!value) return {};
    const plain =
      typeof value.toObject === "function"
        ? value.toObject({ flattenMaps: true, versionKey: false })
        : value;
    return JSON.parse(JSON.stringify(plain));
  }

  normalizeSettings(settings) {
    const plain = this.toPlainObject(settings);
    delete plain._id;
    delete plain.__v;
    const defaults = this.getDefaultSettings();
    return {
      ...defaults,
      ...plain,
      automod: { ...defaults.automod, ...(plain.automod || {}) },
      logs: {
        ...defaults.logs,
        ...(plain.logs || {}),
        categories: {
          ...defaults.logs.categories,
          ...(plain.logs?.categories || {}),
        },
      },
      level: { ...defaults.level, ...(plain.level || {}) },
      streak: { ...defaults.streak, ...(plain.streak || {}) },
      welcome: { ...defaults.welcome, ...(plain.welcome || {}) },
      farewell: { ...defaults.farewell, ...(plain.farewell || {}) },
      autorole: { ...defaults.autorole, ...(plain.autorole || {}) },
      tickets: { ...defaults.tickets, ...(plain.tickets || {}) },
    };
  }

  async loadGuildSettingsCache() {
    const settings = await GuildSetting.find({}).lean({ flattenMaps: true });
    this.guildSettingsCache.clear();
    for (const entry of settings) {
      this.guildSettingsCache.set(entry.guildId, this.normalizeSettings(entry));
    }
  }

  rebuildLegacySettingsStore() {
    // Deprecated: No longer copying full cache to legacyStores for performance.
    // legacyStores.set("settings.json") is now handled on-demand if needed.
  }

  ensureCachedGuildSettings(guildId) {
    if (!this.guildSettingsCache.has(guildId)) {
      const settings = { guildId, ...this.getDefaultSettings() };
      this.guildSettingsCache.set(guildId, settings);
    }
    return this.guildSettingsCache.get(guildId);
  }

  applyDotPath(target, path, value) {
    const parts = path.split(".");
    let cursor = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      // Prototype Pollution Protection (M-2 Fix)
      if (part === "__proto__" || part === "constructor" || part === "prototype") continue;

      if (!cursor[part] || typeof cursor[part] !== "object") {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }
    const finalPart = parts[parts.length - 1];
    if (finalPart !== "__proto__" && finalPart !== "constructor" && finalPart !== "prototype") {
        cursor[finalPart] = value;
    }
  }

  updateCachedGuildSettings(guildId, updates) {
    const cached = this.ensureCachedGuildSettings(guildId);
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes(".")) this.applyDotPath(cached, key, value);
      else cached[key] = value;
    }
  }

  async persistGuildSettings(guildId, settings) {
    const normalized = this.normalizeSettings({ guildId, ...settings });
    this.guildSettingsCache.set(guildId, normalized);

    if (!this.isReady) return null;
    return GuildSetting.updateOne(
      { guildId },
      { $set: normalized },
      { upsert: true },
    );
  }

  async getSettings(guildId, forceRefresh = false) {
    // Optimization (High Severity Fix): Use cache if available unless refresh forced
    if (!forceRefresh && this.guildSettingsCache.has(guildId)) {
        return this.guildSettingsCache.get(guildId);
    }

    if (!this.isReady) {
      return this.ensureCachedGuildSettings(guildId);
    }

    try {
      const settings = await GuildSetting.findOneAndUpdate(
        { guildId },
        { $setOnInsert: { guildId, ...this.getDefaultSettings() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      const normalized = this.normalizeSettings(settings);
      this.guildSettingsCache.set(guildId, normalized);
      return normalized;
    } catch (err) {
      log.warn(`Failed to fetch settings from DB for ${guildId}: ${err.message}. Using cache.`);
      return this.ensureCachedGuildSettings(guildId);
    }
  }

  async updateSettings(guildId, data) {
    this.updateCachedGuildSettings(guildId, data);
    if (!this.isReady) return null;

    try {
        return await GuildSetting.updateOne(
          { guildId },
          { $set: data },
          { upsert: true },
        );
    } catch (err) {
        log.error(`Failed to persist settings for ${guildId}:`, err);
        return null;
    }
  }

  // --- Economy Delegation ---
  async getUserData(userId) { if (!this.isReady) return {}; return this.economy.getUserData(userId); }
  async getCoins(userId) { if (!this.isReady) return 0; return this.economy.getCoins(userId); }
  async saveCoins(userId, amount) { if (!this.isReady) return null; return this.economy.saveCoins(userId, amount); }
  async saveXp(userId, xp) { if (!this.isReady) return null; return this.economy.saveXp(userId, xp); }
  async addCoins(userId, amount) { if (!this.isReady) return 0; return this.economy.addCoins(userId, amount); }
  async getTopUsers(limit = 10) { if (!this.isReady) return []; return this.economy.getTopUsers(limit); }
  async getWorkData(userId) { if (!this.isReady) return {}; return this.economy.getWorkData(userId); }
  async saveWorkData(userId, workData) { if (!this.isReady) return null; return this.economy.saveWorkData(userId, workData); }
  async saveDailyData(userId, dailyData) { if (!this.isReady) return null; return this.economy.saveDailyData(userId, dailyData); }
  async updateLeveling(userId, xpGain, coinsGain) { if (!this.isReady) return null; return this.economy.updateLeveling(userId, xpGain, coinsGain); }

  // --- Cache Management ---
  evictGuild(guildId) {
    if (this.guildSettingsCache.has(guildId)) {
      this.guildSettingsCache.delete(guildId);
      log.info(`Evicted guild ${guildId} from cache.`);
    }
  }

  // --- Moderation Delegation ---
  async getWarns(guildId, userId) { if (!this.isReady) return []; return this.moderation.getWarns(guildId, userId); }
  async addWarn(guildId, userId, moderatorId, reason) { if (!this.isReady) return null; return this.moderation.addWarn(guildId, userId, moderatorId, reason); }
  async clearWarns(guildId, userId) { if (!this.isReady) return null; return this.moderation.clearWarns(guildId, userId); }
  async setUserFrozen(userId, frozen) { if (!this.isReady) return null; return this.moderation.setUserFrozen(userId, frozen); }
  async logModAction(guild, userTag, action, reason, moderator, extra = []) { if (!this.isReady) return null; return this.moderation.logModAction(guild, userTag, action, reason, moderator, extra); }

  // --- Marriage Delegation ---
  async getMarriage(userId) { if (!this.isReady) return null; return this.marriage.getMarriage(userId); }
  async createMarriage(user1Id, user2Id, proposerId, guildId) { if (!this.isReady) return null; return this.marriage.createMarriage(user1Id, user2Id, proposerId, guildId); }
  async divorce(userId) { if (!this.isReady) return null; return this.marriage.divorce(userId); }
  async getMarriageStats() { if (!this.isReady) return []; return this.marriage.getMarriageStats(); }

  // --- Ticket Delegation ---
  async getTicketsConfig() { return this.tickets.getTicketsConfig(); }
  async saveTicketsConfig(config) { return this.tickets.saveTicketsConfig(config); }

  // --- Legacy / Misc ---
  async get(key) {
    if (key === "updates.json") {
      const updates = {};
      for (const [guildId, settings] of this.guildSettingsCache.entries()) {
        if (settings.updates) updates[guildId] = settings.updates;
      }
      return updates;
    }

    // Lazy legacy store for settings.json (High Severity Fix: Avoid O(n) copy on every write)
    if (key === "settings.json") {
      const settingsStore = {};
      for (const [guildId, settings] of this.guildSettingsCache.entries()) {
        settingsStore[guildId] = settings;
      }
      return settingsStore;
    }

    return this.legacyStores.get(key) || {};
  }

  set(key, value) {
    this.legacyStores.set(key, value);
    if (key === "updates.json") {
      for (const [guildId, updates] of Object.entries(value)) {
        this.updateSettings(guildId, { updates }).catch((error) => {
          console.error("Failed to persist update config:", error);
        });
      }
    }
  }
}

module.exports = new Database();
