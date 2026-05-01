const GuildSetting = require("../../models/GuildSetting");

class TicketService {
  constructor(db) {
    this.db = db;
  }

  async getTicketsConfig() {
    // Note: This relies on the database cache which is still in db.js for now
    const tickets = {};
    for (const [guildId, settings] of this.db.guildSettingsCache.entries()) {
      tickets[guildId] = settings.tickets || this.db.getDefaultSettings().tickets;
    }
    return tickets;
  }

  async saveTicketsConfig(ticketsConfig) {
    const tasks = Object.entries(ticketsConfig).map(([guildId, tickets]) =>
      this.db.updateSettings(guildId, { tickets }),
    );
    await Promise.all(tasks);
  }
}

module.exports = TicketService;
