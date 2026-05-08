const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");
const { Colors, Emojis, createBaseEmbed, createLogEmbed, success, error } = require("../utils/embeds");

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
          const embed = createLogEmbed(
            "Command Executed",
            null,
            Colors.SUCCESS,
            [
              {
                name: "Command",
                value: `\`/${interaction.commandName}\``,
                inline: true,
              },
              { name: "User", value: `**${interaction.user.tag}**`, inline: true },
              {
                name: "Channel",
                value: `<#${interaction.channel.id}>`,
                inline: true,
              },
            ],
            "ℹ️ Command Logger"
          );
          await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      } catch (err) {
        console.error(`Error executing ${interaction.commandName}:`, err);
        const errEmbed = error(interaction.user, "An unexpected error occurred while executing this command.", "Error", "🤖 Command Execution");
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errEmbed] }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errEmbed], flags: 64 }).catch(() => {});
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
            embeds: [error(user, "The ticket system is not yet configured for this server.", "Error", "🎫 Ticket System")],
            flags: 64,
          });

        if (customId === "create_ticket") {
          await interaction.deferReply({ ephemeral: true });
          const activeTickets = guildConfig.activeTickets || {};
          if (Object.values(activeTickets).some((t) => t.userId === user.id)) {
            return interaction.editReply({
              embeds: [error(user, "You already have an open ticket. Please close it before opening a new one.", "Error", "🎫 Ticket System")],
            });
          }

          const category = guild.channels.cache.get(
            guildConfig.ticketsCategory,
          );
          if (!category)
            return interaction.editReply({
              embeds: [error(user, "Ticket category not found. Please contact an administrator.", "Error", "🎫 Ticket System")],
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
          await interaction.editReply({
            embeds: [success(user, `Your ticket has been created: ${channel}`, "Ticket Created", "🎫 Ticket System")],
          });
        } else if (customId === "close_ticket") {
          await interaction.deferReply({ ephemeral: true });
          const activeTickets = guildConfig.activeTickets || {};
          const ticketId = Object.keys(activeTickets).find(
            (id) => activeTickets[id].channelId === interaction.channel.id,
          );
          if (!ticketId)
            return interaction.editReply({
              embeds: [error(user, "Ticket data not found in database.", "Error", "🎫 Ticket System")],
            });

          await interaction.editReply({ embeds: [success(user, "This ticket will be closed and deleted in **5 seconds**.", "Closing Ticket", "🎫 Ticket System")] });
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
            embeds: [error(user, "The requested role could not be found.", "Error", "🎭 Reaction Roles")],
            flags: 64,
          });

        try {
          if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(role);
            await interaction.reply({
              embeds: [success(user, `The role **${role.name}** has been removed.`, "Role Removed", "🎭 Reaction Roles")],
              flags: 64,
            });
          } else {
            await interaction.member.roles.add(role);
            await interaction.reply({
              embeds: [success(user, `The role **${role.name}** has been added.`, "Role Added", "🎭 Reaction Roles")],
              flags: 64,
            });
          }
        } catch (e) {
          await interaction.reply({
            embeds: [error(user, "Failed to update your roles. Please check the bot's permissions.", "Error", "🎭 Reaction Roles")],
            flags: 64,
          });
        }
      }
    }

    // Handle Modal Submissions
    else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("embedModal:")) {
        const channelId = interaction.customId.split(":")[1];
        const channel = interaction.guild.channels.cache.get(channelId);
        const title = interaction.fields.getTextInputValue("title");
        const desc = interaction.fields.getTextInputValue("desc");
        const colorInput = interaction.fields.getTextInputValue("color");
        
        const embed = createBaseEmbed(interaction.user, {
          title,
          description: desc,
          color: colorInput && /^#[0-9A-F]{6}$/i.test(colorInput) ? parseInt(colorInput.replace("#", ""), 16) : Colors.INFO,
        });
        
        if (channel) {
          await channel.send({ embeds: [embed] });
          await interaction.reply({ embeds: [success(interaction.user, `Embed sent to ${channel}.`, "Embed Sent", "📝 Modals")], flags: 64 });
        } else {
          await interaction.reply({ embeds: [error(interaction.user, "Target channel not found.", "Error", "📝 Modals")], flags: 64 });
        }
      } else {
        await interaction.reply({
          embeds: [success(interaction.user, "Your submission has been received and processed.", "Submission Received", "📝 Modals")],
          flags: 64,
        });
      }
    }
  },
};
