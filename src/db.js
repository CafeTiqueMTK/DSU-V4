const mongoose = require("mongoose");
const { config } = require("./utils/env.js");
const GuildSetting = require("./models/GuildSetting.js");
const economyService = require("./modules/economy/EconomyService");
const moderationService = require("./modules/moderation/ModerationService");
const marriageService = require("./modules/marriage/MarriageService");
const TicketService = require("./modules/tickets/TicketService");

class Database {
  constructor() {
    this.isReady = false;
    this.guildSettingsCache = new Map();
    this.legacyStores = new Map();
    this.tickets = new TicketService(this);
  }

  async init() {
    if (this.isReady) return;
    if (!config.mongoUri) {
      console.error("MONGODB_URI is not defined in environment variables.");
      throw new Error("MongoDB URI is required.");
    }

    try {
      mongoose.set("strictQuery", false);
      await mongoose.connect(config.mongoUri);
      this.isReady = true;
      await this.loadGuildSettingsCache();
      console.log("Connected to MongoDB.");
    } catch (error) {
      console.error("Could not connect to MongoDB:", error);
      throw error;
    }
  }

  async shutdown() {
    if (!this.isReady) return;
    await mongoose.disconnect();
    this.isReady = false;
    console.log("Disconnected from MongoDB.");
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
        },
        blockedRoles: [],
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
          gemini: true,
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
      antiRaid: { enabled: false, threshold: 5 },
      antiMassMention: { enabled: false },
      antiSpam: { enabled: false },
      antiInvites: { enabled: false },
      antiLinks: { enabled: false },
      antiRoles: { enabled: false },
      antiKeywords: { enabled: false, keywords: [] },
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
    this.rebuildLegacySettingsStore();
  }

  rebuildLegacySettingsStore() {
    const settingsStore = {};
    for (const [guildId, settings] of this.guildSettingsCache.entries()) {
      settingsStore[guildId] = settings;
    }
    this.legacyStores.set("settings.json", settingsStore);
  }

  ensureCachedGuildSettings(guildId) {
    if (!this.guildSettingsCache.has(guildId)) {
      const settings = { guildId, ...this.getDefaultSettings() };
      this.guildSettingsCache.set(guildId, settings);
      this.rebuildLegacySettingsStore();
    }
    return this.guildSettingsCache.get(guildId);
  }

  applyDotPath(target, path, value) {
    const parts = path.split(".");
    let cursor = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      if (!cursor[part] || typeof cursor[part] !== "object") {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  updateCachedGuildSettings(guildId, updates) {
    const cached = this.ensureCachedGuildSettings(guildId);
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes(".")) this.applyDotPath(cached, key, value);
      else cached[key] = value;
    }
    this.rebuildLegacySettingsStore();
  }

  async persistGuildSettings(guildId, settings) {
    const normalized = this.normalizeSettings({ guildId, ...settings });
    this.guildSettingsCache.set(guildId, normalized);
    this.rebuildLegacySettingsStore();

    if (!this.isReady) return null;
    return GuildSetting.updateOne(
      { guildId },
      { $set: normalized },
      { upsert: true },
    );
  }

  async getSettings(guildId) {
    if (!this.isReady) throw new Error("Database not ready");
    const settings = await GuildSetting.findOneAndUpdate(
      { guildId },
      { $setOnInsert: { guildId, ...this.getDefaultSettings() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const normalized = this.normalizeSettings(settings);
    this.guildSettingsCache.set(guildId, normalized);
    this.rebuildLegacySettingsStore();
    return normalized;
  }

  async updateSettings(guildId, data) {
    if (!this.isReady) throw new Error("Database not ready");
    this.updateCachedGuildSettings(guildId, data);
    return GuildSetting.updateOne(
      { guildId },
      { $set: data },
      { upsert: true },
    );
  }

  // --- Economy Delegation ---
  async getUserData(userId) { return economyService.getUserData(userId); }
  async getCoins(userId) { return economyService.getCoins(userId); }
  async saveCoins(userId, amount) { return economyService.saveCoins(userId, amount); }
  async addCoins(userId, amount) { return economyService.addCoins(userId, amount); }
  async getTopUsers(limit = 10) { return economyService.getTopUsers(limit); }
  async getWorkData(userId) { return economyService.getWorkData(userId); }
  async saveWorkData(userId, workData) { return economyService.saveWorkData(userId, workData); }
  async saveDailyData(userId, dailyData) { return economyService.saveDailyData(userId, dailyData); }

  // --- Moderation Delegation ---
  async getWarns(guildId, userId) { return moderationService.getWarns(guildId, userId); }
  async addWarn(guildId, userId, moderatorId, reason) { return moderationService.addWarn(guildId, userId, moderatorId, reason); }
  async clearWarns(guildId, userId) { return moderationService.clearWarns(guildId, userId); }
  async setUserFrozen(userId, frozen) { return moderationService.setUserFrozen(userId, frozen); }
  async logModAction(guild, userTag, action, reason, moderator, extra = []) { return moderationService.logModAction(guild, userTag, action, reason, moderator, extra); }

  // --- Marriage Delegation ---
  async getMarriage(userId) { return marriageService.getMarriage(userId); }
  async createMarriage(user1Id, user2Id, proposerId, guildId) { return marriageService.createMarriage(user1Id, user2Id, proposerId, guildId); }
  async divorce(userId) { return marriageService.divorce(userId); }
  async getMarriageStats() { return marriageService.getMarriageStats(); }

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
