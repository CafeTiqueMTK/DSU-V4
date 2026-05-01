const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);

        // Log command execution (async)
        const logChannel = await getLogChannel(interaction.guild, "commands");
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle("⚡ Command Executed")
            .addFields(
              {
                name: "Command",
                value: `\`/${interaction.commandName}\``,
                inline: true,
              },
              { name: "User", value: `${interaction.user.tag}`, inline: true },
              {
                name: "Channel",
                value: `<#${interaction.channel.id}>`,
                inline: true,
              },
            )
            .setColor(0x00ff99)
            .setTimestamp();
          await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        if (interaction.deferred || interaction.replied) {
          await interaction
            .editReply({ content: "❌ An error occurred." })
            .catch(() => {});
        } else {
          await interaction
            .reply({ content: "❌ An error occurred.", ephemeral: true })
            .catch(() => {});
        }
      }
    }

    // Handle Button Interactions
    else if (interaction.isButton()) {
      const { customId, guild, user } = interaction;

      // --- Ticket System ---
      if (customId === "create_ticket" || customId === "close_ticket") {
        const settings = await db.getSettings(guild.id);
        const guildConfig = settings.tickets.toObject
          ? settings.tickets.toObject()
          : settings.tickets;

        if (!guildConfig || !guildConfig.setup)
          return interaction.reply({
            content: "❌ Ticket system not configured.",
            ephemeral: true,
          });

        if (customId === "create_ticket") {
          const activeTickets = guildConfig.activeTickets || {};
          if (Object.values(activeTickets).some((t) => t.userId === user.id)) {
            return interaction.reply({
              content: "❌ You already have an open ticket.",
              ephemeral: true,
            });
          }

          const category = guild.channels.cache.get(
            guildConfig.ticketsCategory,
          );
          if (!category)
            return interaction.reply({
              content: "❌ Ticket category not found.",
              ephemeral: true,
            });

          const channel = await guild.channels.create({
            name: `${guildConfig.ticketPrefix || "ticket"}-${user.username}`,
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
            ticketName: `${guildConfig.ticketPrefix || "ticket"}-${user.username}`,
          };

          await db.updateSettings(guild.id, {
            [`tickets.activeTickets.${ticketId}`]: newActiveTicket,
          });

          const embed = new EmbedBuilder()
            .setTitle("🎫 Support Ticket")
            .setDescription(
              guildConfig.welcomeMessage || "Welcome! How can we help you?",
            )
            .setColor(0x00ff99);
          const closeBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("close_ticket")
              .setLabel("Close")
              .setStyle(ButtonStyle.Danger)
              .setEmoji("🔒"),
          );
          await channel.send({ embeds: [embed], components: [closeBtn] });
          await interaction.reply({
            content: `✅ Ticket created: ${channel}`,
            ephemeral: true,
          });
        } else if (customId === "close_ticket") {
          const activeTickets = guildConfig.activeTickets || {};
          const ticketId = Object.keys(activeTickets).find(
            (id) => activeTickets[id].channelId === interaction.channel.id,
          );
          if (!ticketId)
            return interaction.reply({
              content: "❌ Ticket data not found.",
              ephemeral: true,
            });

          await interaction.reply({ content: "✅ Ticket closing in 5s..." });
          setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
            const GuildSetting = require("../models/GuildSetting.js");
            await GuildSetting.updateOne(
              { guildId: guild.id },
              { $unset: { [`tickets.activeTickets.${ticketId}`]: "" } },
            );
          }, 5000);
        }
      }

      // --- Reaction Roles ---
      else if (customId.startsWith("reaction_role_")) {
        const roleId = customId.replace("reaction_role_", "");
        const role = guild.roles.cache.get(roleId);
        if (!role)
          return interaction.reply({
            content: "❌ Role not found.",
            ephemeral: true,
          });

        try {
          if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(role);
            await interaction.reply({
              content: `🔴 Role **${role.name}** removed.`,
              ephemeral: true,
            });
          } else {
            await interaction.member.roles.add(role);
            await interaction.reply({
              content: `🟢 Role **${role.name}** added.`,
              ephemeral: true,
            });
          }
        } catch (e) {
          await interaction.reply({
            content: "❌ Failed to update roles. Check permissions.",
            ephemeral: true,
          });
        }
      }
    }

    // Handle Modal Submissions
    else if (interaction.isModalSubmit()) {
      await interaction.reply({
        content: "✅ Submission received.",
        ephemeral: true,
      });
    }
  },
};
