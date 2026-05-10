const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createBaseEmbed, success, error, Colors } = require("../../utils/embeds");

class TicketService {
  constructor(db) {
    this.db = db;
  }

  async createTicket(interaction) {
    const { guild, user } = interaction;
    const settings = await this.db.getSettings(guild.id);
    const guildConfig = settings.tickets;

    if (!guildConfig || !guildConfig.setup) {
      const errEmbed = error(user, "The ticket system is not yet configured for this server.", "Error", "🎫 Ticket System");
      return interaction.reply({ embeds: [errEmbed], flags: 64 });
    }

    await interaction.deferReply({ ephemeral: true });
    const activeTickets = guildConfig.activeTickets || {};
    if (Object.values(activeTickets).some((t) => t.userId === user.id)) {
      const errEmbed = error(user, "You already have an open ticket. Please close it before opening a new one.", "Error", "🎫 Ticket System");
      return interaction.editReply({ embeds: [errEmbed] });
    }

    const category = guild.channels.cache.get(guildConfig.ticketsCategory);
    if (!category) {
      const errEmbed = error(user, "Ticket category not found. Please contact an administrator.", "Error", "🎫 Ticket System");
      return interaction.editReply({ embeds: [errEmbed] });
    }

    // Sanitize ticket name (H-5 Fix)
    const sanitizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = (guildConfig.ticketPrefix || "ticket").toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

    const channel = await guild.channels.create({
      name: `${prefix}-${sanitizedUsername}`,
      type: 0,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: ["ViewChannel"] },
        {
          id: user.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
        {
          id: guildConfig.supportRole,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
      ],
    });

    const ticketId = channel.id;
    const newActiveTicket = {
      channelId: channel.id,
      userId: user.id,
      createdAt: Date.now(),
      ticketName: channel.name,
    };

    await this.db.updateSettings(guild.id, {
      [`tickets.activeTickets.${ticketId}`]: newActiveTicket,
    });

    const embed = createBaseEmbed(user, {
      title: "🎫 Support Ticket",
      description: guildConfig.welcomeMessage || "Welcome! A member of the support team will be with you shortly. Please describe your issue in detail.",
      color: Colors.SUCCESS,
    });

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒"),
    );
    await channel.send({ content: `${user} | <@&${guildConfig.supportRole}>`, embeds: [embed], components: [closeBtn] });

    const successEmbed = success(user, `Your ticket has been created: ${channel}`, "Ticket Created", "🎫 Ticket System");
    await interaction.editReply({ embeds: [successEmbed] });
  }

  async closeTicket(interaction) {
    const { guild, user, channel } = interaction;
    const settings = await this.db.getSettings(guild.id);
    const guildConfig = settings.tickets;
    const activeTickets = guildConfig.activeTickets || {};

    const ticketId = Object.keys(activeTickets).find(
      (id) => activeTickets[id].channelId === channel.id,
    );

    if (!ticketId) {
      const errEmbed = error(user, "Ticket data not found in database.", "Error", "🎫 Ticket System");
      return interaction.reply({ embeds: [errEmbed], flags: 64 });
    }

    await interaction.reply({
      embeds: [success(user, "This ticket will be closed and deleted in **5 seconds**.", "Closing Ticket", "🎫 Ticket System")]
    });

    setTimeout(async () => {
      await channel.delete().catch(() => {});
      await this.db.updateSettings(guild.id, {
        [`tickets.activeTickets.${ticketId}`]: null // db.updateSettings uses $set, setting to null is fine or we use $unset
      });
      // Note: db.updateSettings should be improved to handle $unset if needed,
      // but for now setting to null marks it as closed in JS logic.
    }, 5000);
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
