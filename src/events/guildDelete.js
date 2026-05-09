const { Events } = require("discord.js");
const db = require("../db");

module.exports = {
  name: Events.GuildDelete,
  async execute(guild) {
    // Evict from cache when bot leaves a guild
    db.evictGuild(guild.id);
  },
};
