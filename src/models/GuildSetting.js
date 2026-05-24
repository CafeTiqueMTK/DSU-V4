const { Schema, model } = require("mongoose");

const guildSettingsSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },

    automod: {
      enabled: { type: Boolean, default: false },
      actionChannel: { type: String, default: null },
      blockedRoles: { type: [String], default: [] },
    },

    logs: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
      categories: { type: Map, of: Boolean, default: {} },
    },

    welcome: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },

    farewell: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
    },

    autorole: {
      enabled: { type: Boolean, default: false },
      roleId: { type: String, default: null },
    },

    funny: { type: Map, of: { enabled: Boolean }, default: {} },

    // Anti-protections
    antiBot: { enabled: { type: Boolean, default: false } },
    antiRaid: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 5 },
    },
    antiMassMention: { enabled: { type: Boolean, default: false } },
    antiSpam: { enabled: { type: Boolean, default: false } },
    antiInvites: { enabled: { type: Boolean, default: false } },
    antiLinks: { enabled: { type: Boolean, default: false } },
    antiRoles: { enabled: { type: Boolean, default: false } },
    antiKeywords: {
      enabled: { type: Boolean, default: false },
      keywords: { type: [String], default: [] },
    },

    // Tickets & Reaction Roles
    tickets: {
      setup: { type: Boolean, default: false },
      supportRole: { type: String, default: null },
      ticketsCategory: { type: String, default: null },
      welcomeMessage: {
        type: String,
        default: "Welcome to your ticket! A support member will assist you soon.",
      },
      ticketPrefix: { type: String, default: "ticket" },
      activeTickets: {
        type: Map,
        of: new Schema(
          {
            userId: { type: String },
            channelId: { type: String },
            createdAt: { type: Date },
          },
          { _id: false },
        ),
        default: {},
      },
    },
    reactionRoles: {
      type: Map,
      of: new Schema(
        {
          channelId: { type: String },
          messageId: { type: String },
          roleId: { type: String },
          emoji: { type: String },
        },
        { _id: false },
      ),
      default: {},
    },
    warnActions: { type: Map, of: String, default: {} }, // Map: warnCount -> action (e.g. "mute", "kick", "ban")
    moderatorRole: { type: String, default: null },
    marriageConfig: {
      announcementChannel: { type: String, default: null },
    },
  },
  { timestamps: true, minimize: false, strict: true },
);

module.exports = model("GuildSetting", guildSettingsSchema);
