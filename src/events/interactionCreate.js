const {
  Events,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("../db.js");
const { getLogChannel } = require("../utils/logger");
const { Colors, createBaseEmbed, createLogEmbed, success, error, botFailure } = require("../utils/embeds");
const notify = require("../services/NotificationService");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    // Crash Mode Simulation (Audit/CrashMode Fix)
    if (process.env.CRASH_MODE === "true" && interaction.isChatInputCommand()) {
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

        // Notify WhatsApp on component failure
        await notify.notifyComponentFailure(`/${interaction.commandName}`, new Error("Command script not loaded or corrupted"));

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

        // Log command execution (async)
        // ... (rest of the log logic)

        // Log command execution (async)
        getLogChannel(interaction.guild, "commands").then(logChannel => {
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
            logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }).catch(() => {});
      } catch (err) {
        console.error(`Error executing ${interaction.commandName}:`, err);

        // Notify WhatsApp on execution crash
        await notify.notifyComponentFailure(`/${interaction.commandName}`, err);

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
      const { customId, guild, user } = interaction;

      // --- Ticket System (Refactored) ---
      if (customId === "create_ticket") {
        return await db.tickets.createTicket(interaction);
      } else if (customId === "close_ticket") {
        return await db.tickets.closeTicket(interaction);
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

      // --- Interactive Dashboard (Refactored) ---
      else if (customId.startsWith("dash_")) {
        // DB Readiness Check for Dashboard
        if (!db.isReady) {
            const { dbOffline } = require("../utils/embeds");
            return await interaction.reply({ embeds: [dbOffline(user, "Dashboard")], flags: 64 });
        }

        const dashManager = require("../utils/dashboardManager");
        const guildId = interaction.guild.id;

        // Navigation
        if (customId === "dash_main") {
            const ui = await dashManager.getMainMenu(user, guildId);
            return await interaction.update(ui);
        }
        if (customId === "dash_menu_mod") {
            const ui = await dashManager.getModMenu(user, guildId);
            return await interaction.update(ui);
        }
        if (customId === "dash_menu_gen") {
            const ui = await dashManager.getGeneralMenu(user, guildId, client);
            return await interaction.update(ui);
        }
        if (customId === "dash_menu_eco") {
            const ui = await dashManager.getEcoMenu(user, guildId);
            return await interaction.update(ui);
        }
        if (customId === "dash_menu_tickets") {
            const ui = await dashManager.getTicketsMenu(user, guildId);
            return await interaction.update(ui);
        }
        if (customId === "dash_close") {
            return await interaction.message.delete().catch(() => {});
        }

        // Toggles
        const settings = await db.getSettings(guildId);
        let updates = {};

        if (customId === "dash_toggle_automod") updates = { "automod.enabled": !settings.automod?.enabled };
        else if (customId === "dash_toggle_logs") updates = { "logs.enabled": !settings.logs?.enabled };
        else if (customId === "dash_toggle_antispam") updates = { "antiSpam.enabled": !settings.antiSpam?.enabled };
        else if (customId === "dash_toggle_antiraid") updates = { "antiRaid.enabled": !settings.antiRaid?.enabled };
        else if (customId === "dash_toggle_antilinks") updates = { "antiLinks.enabled": !settings.antiLinks?.enabled };
        else if (customId === "dash_toggle_economy") updates = { "streak.enabled": !settings.streak?.enabled };
        else if (customId === "dash_toggle_levels") updates = { "level.enabled": !settings.level?.enabled };
        else if (customId === "dash_toggle_welcome") updates = { "welcome.enabled": !settings.welcome?.enabled };
        else if (customId === "dash_toggle_farewell") updates = { "farewell.enabled": !settings.farewell?.enabled };

        if (Object.keys(updates).length > 0) {
            await db.updateSettings(guildId, updates);
            // Refresh current view
            let ui;
            if (customId.includes("eco") || customId.includes("levels")) ui = await dashManager.getEcoMenu(user, guildId);
            else if (customId.includes("mod") || customId.includes("logs") || customId.includes("anti")) ui = await dashManager.getModMenu(user, guildId);
            else if (customId.includes("welcome") || customId.includes("farewell")) ui = await dashManager.getGeneralMenu(user, guildId, client);
            else ui = await dashManager.getMainMenu(user, guildId);

            return await interaction.update(ui);
        }
      }
    }

    // Handle Select Menus
    else if (interaction.isStringSelectMenu()) {
        const { customId, guild, user, values } = interaction;

        if (customId.startsWith("dash_select_")) {
            // DB Readiness Check
            if (!db.isReady) {
                const { dbOffline } = require("../utils/embeds");
                return await interaction.reply({ embeds: [dbOffline(user, "Dashboard")], flags: 64 });
            }

            const dashManager = require("../utils/dashboardManager");
            const guildId = guild.id;
            let updates = {};

            if (customId === "dash_select_welcome_channel") {
                updates = { "welcome.channel": values[0] };
            }

            if (Object.keys(updates).length > 0) {
                await db.updateSettings(guildId, updates);
                const ui = await dashManager.getGeneralMenu(user, guildId, client);
                return await interaction.update(ui);
            }
        }
    }

    // Handle Modal Submissions
    else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("embedModal:")) {
        // H-1: Permission Check
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            embeds: [error(interaction.user, "You lack permissions to send embeds via this system.", "Permission Denied", "🛡️ Security System")],
            flags: 64
          });
        }

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
