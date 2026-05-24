const { Events } = require("discord.js");
const db = require("../db.js");
const { config } = require("../utils/env.js");
const { getLogChannel } = require("../utils/logger");
const { Colors, createLogEmbed, success, botFailure } = require("../utils/embeds");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    // Crash Mode Simulation (CrashMode Fix)
    if (config.crashMode && interaction.isChatInputCommand()) {
        const shouldCrash = Math.random() < 0.3; // 30% chance to crash
        if (shouldCrash) {
            throw new Error("CRASH_MODE: Simulated internal script failure for testing stability.");
        }
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      // Handle "Module Down" - Command is registered in Discord but failed to load in bot
      if (!command) {
        console.error(`[CRITICAL] Command /${interaction.commandName} was invoked but is not loaded.`);

        const failEmbed = botFailure("Partial Module Failure", `The module for \`/${interaction.commandName}\` is currently unavailable or failed to load. The Core remains stable.`);

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [failEmbed] }).catch(() => {});
        } else {
            await interaction.reply({ embeds: [failEmbed], flags: 64 }).catch(() => {});
        }
        return;
      }

      // Handle Database Dependency
      if (command.requiresDb && !db.isReady) {
        const { dbOffline } = require("../utils/embeds");
        const embed = dbOffline(interaction.user, interaction.commandName);
        return await interaction.reply({ embeds: [embed], flags: 64 });
      }

      try {
        await command.execute(interaction);
// ... rest of the file

        // Log command execution
        try {
          const logChannel = await getLogChannel(interaction.guild, "commands");
          if (logChannel) {
            const embed = createLogEmbed(
              "Command Executed",
              null,
              Colors.SUCCESS,
              [
                { name: "Command", value: `\`/${interaction.commandName}\``, inline: true },
                { name: "User", value: `**${interaction.user.tag}**`, inline: true },
                { name: "Channel", value: `<#${interaction.channel.id}>`, inline: true },
              ],
              "ℹ️ Command Logger"
            );
            await logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (logErr) {
          console.error("Failed to log command:", logErr);
        }
      } catch (err) {
        console.error(`Error executing ${interaction.commandName}:`, err);

        const failEmbed = botFailure("Execution Crash", `An unexpected error occurred in \`/${interaction.commandName}\` script.\n\n**Error:** \`${err.message}\``);

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [failEmbed] }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [failEmbed], flags: 64 }).catch(() => {});
        }
      }
    }

    // Handle Context Menus (H-3 Fix)
    else if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(`Error executing context menu ${interaction.commandName}:`, err);
            const failEmbed = botFailure("Context Menu Crash", `Error: ${err.message}`);
            if (interaction.deferred || interaction.replied) await interaction.editReply({ embeds: [failEmbed] }).catch(() => {});
            else await interaction.reply({ embeds: [failEmbed], flags: 64 }).catch(() => {});
        }
    }

    // Handle Autocomplete (H-3 Fix)
    else if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;
        try {
            await command.autocomplete(interaction);
        } catch (err) {
            console.error(`Autocomplete error for ${interaction.commandName}:`, err);
        }
    }

    // Handle Button Interactions
    else if (interaction.isButton()) {
      const { customId } = interaction;

      // --- Ticket System (Refactored) ---
      if (customId === "create_ticket") {
        return await db.tickets.createTicket(interaction);
      } else if (customId === "close_ticket") {
        return await db.tickets.closeTicket(interaction);
      }

      // --- Reaction Roles (Delegated to Service) ---
      else if (customId.startsWith("reaction_role_")) {
        return await db.handleReactionRole(interaction);
      }
    }

    // Handle Select Menus
    else if (interaction.isStringSelectMenu()) {
        // Handle select menus here
    }

    // Handle Modal Submissions
    else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("embedModal:")) {
        return await db.handleEmbedModal(interaction);
      } else {
        await interaction.reply({
          embeds: [success(interaction.user, "Your submission has been received and processed.", "Submission Received", "📝 Modals")],
          flags: 64,
        });
      }
    }
  },
};
