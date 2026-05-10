const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const db = require("../db");
const { Colors, createBaseEmbed } = require("./embeds");

/**
 * Dashboard Manager
 * Generates interactive UI for the in-Discord configuration panel.
 */
class DashboardManager {
    /**
     * Main Menu
     */
    async getMainMenu(user, guildId) {
        const settings = await db.getSettings(guildId);

        const embed = createBaseEmbed(user, {
            module: "🛡️ Control Panel",
            title: "📊 Server Dashboard",
            description: `Welcome to the interactive configuration dashboard for **${user.username}**.\nUse the buttons below to manage your server modules.`,
            color: Colors.ADMIN
        })
        .addFields(
            { name: "🛡️ Moderation", value: `Automod: ${settings.automod?.enabled ? "✅" : "❌"}\nLogs: ${settings.logs?.enabled ? "✅" : "❌"}`, inline: true },
            { name: "💰 Economy", value: `System: ${settings.streak?.enabled ? "✅" : "❌"}\nXP: ${settings.level?.enabled ? "✅" : "❌"}`, inline: true },
            { name: "🎫 Tickets", value: `Status: ${settings.tickets?.setup ? "✅" : "❌"}`, inline: true }
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("dash_menu_gen").setLabel("General").setStyle(ButtonStyle.Secondary).setEmoji("⚙️"),
            new ButtonBuilder().setCustomId("dash_menu_mod").setLabel("Moderation").setStyle(ButtonStyle.Secondary).setEmoji("🛡️"),
            new ButtonBuilder().setCustomId("dash_menu_eco").setLabel("Economy").setStyle(ButtonStyle.Secondary).setEmoji("💰"),
            new ButtonBuilder().setCustomId("dash_menu_tickets").setLabel("Tickets").setStyle(ButtonStyle.Secondary).setEmoji("🎫"),
            new ButtonBuilder().setCustomId("dash_close").setLabel("Close").setStyle(ButtonStyle.Danger).setEmoji("✖️")
        );

        return { embeds: [embed], components: [row] };
    }

    /**
     * General Sub-Menu (Welcome, Farewell, Select Menus)
     */
    async getGeneralMenu(user, guildId, client) {
        const settings = await db.getSettings(guildId);
        const guild = client.guilds.cache.get(guildId);

        const embed = createBaseEmbed(user, {
            module: "🛡️ Control Panel > General",
            title: "⚙️ General Settings",
            description: "Configure basic bot behavior and announcement channels.",
            color: Colors.INFO
        })
        .addFields(
            { name: "👋 Welcome", value: `Status: ${settings.welcome?.enabled ? "✅" : "❌"}\nChannel: ${settings.welcome?.channel ? `<#${settings.welcome.channel}>` : "Not set"}`, inline: true },
            { name: "🏃 Farewell", value: `Status: ${settings.farewell?.enabled ? "✅" : "❌"}\nChannel: ${settings.farewell?.channel ? `<#${settings.farewell.channel}>` : "Not set"}`, inline: true }
        );

        const rowToggles = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("dash_toggle_welcome")
                .setLabel(settings.welcome?.enabled ? "Disable Welcome" : "Enable Welcome")
                .setStyle(settings.welcome?.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("dash_toggle_farewell")
                .setLabel(settings.farewell?.enabled ? "Disable Farewell" : "Enable Farewell")
                .setStyle(settings.farewell?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        // Channel Select Menu (Example for Welcome Channel)
        const textChannels = guild.channels.cache
            .filter(c => c.type === 0)
            .first(25)
            .map(c => ({ label: `# ${c.name}`, value: c.id }));

        const rowSelect = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("dash_select_welcome_channel")
                .setPlaceholder("Select Welcome Channel")
                .addOptions(textChannels.length > 0 ? textChannels : [{ label: "No channels found", value: "none" }])
                .setDisabled(textChannels.length === 0)
        );

        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("dash_main").setLabel("Back to Main Menu").setStyle(ButtonStyle.Primary).setEmoji("🏠")
        );

        return { embeds: [embed], components: [rowToggles, rowSelect, rowBack] };
    }

    /**
     * Moderation Sub-Menu
     */
    async getModMenu(user, guildId) {
        const settings = await db.getSettings(guildId);

        const embed = createBaseEmbed(user, {
            module: "🛡️ Control Panel > Moderation",
            title: "🛡️ Moderation Settings",
            description: "Configure your server's security and automated moderation.",
            color: Colors.MODERATION
        })
        .addFields(
            { name: "🚨 Automod", value: settings.automod?.enabled ? "Enabled" : "Disabled", inline: true },
            { name: "📊 Logs", value: settings.logs?.enabled ? "Enabled" : "Disabled", inline: true },
            { name: "🛡️ Protections", value: `Anti-Spam: ${settings.antiSpam?.enabled ? "✅" : "❌"}\nAnti-Raid: ${settings.antiRaid?.enabled ? "✅" : "❌"}\nAnti-Link: ${settings.antiLinks?.enabled ? "✅" : "❌"}`, inline: false }
        );

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("dash_toggle_automod")
                .setLabel(settings.automod?.enabled ? "Disable Automod" : "Enable Automod")
                .setStyle(settings.automod?.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("dash_toggle_logs")
                .setLabel(settings.logs?.enabled ? "Disable Logs" : "Enable Logs")
                .setStyle(settings.logs?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("dash_toggle_antispam")
                .setLabel("Spam Shield")
                .setStyle(settings.antiSpam?.enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji("🫧"),
            new ButtonBuilder()
                .setCustomId("dash_toggle_antiraid")
                .setLabel("Raid Shield")
                .setStyle(settings.antiRaid?.enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji("🛡️"),
            new ButtonBuilder()
                .setCustomId("dash_toggle_antilinks")
                .setLabel("Link Shield")
                .setStyle(settings.antiLinks?.enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji("🔗")
        );

        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("dash_main").setLabel("Back to Main Menu").setStyle(ButtonStyle.Primary).setEmoji("🏠")
        );

        return { embeds: [embed], components: [row1, row2, rowBack] };
    }

    /**
     * Economy Sub-Menu
     */
    async getEcoMenu(user, guildId) {
        const settings = await db.getSettings(guildId);

        const embed = createBaseEmbed(user, {
            module: "🛡️ Control Panel > Economy",
            title: "💰 Economy Settings",
            description: "Manage rewards, levels, and user currency settings.",
            color: Colors.ECONOMY
        })
        .addFields(
            { name: "💎 Economy System", value: settings.streak?.enabled ? "Active" : "Inactive", inline: true },
            { name: "📈 Leveling (XP)", value: settings.level?.enabled ? "Active" : "Inactive", inline: true }
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("dash_toggle_economy")
                .setLabel(settings.streak?.enabled ? "Disable Economy" : "Enable Economy")
                .setStyle(settings.streak?.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("dash_toggle_levels")
                .setLabel(settings.level?.enabled ? "Disable Levels" : "Enable Levels")
                .setStyle(settings.level?.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("dash_main").setLabel("Back to Main Menu").setStyle(ButtonStyle.Primary).setEmoji("🏠")
        );

        return { embeds: [embed], components: [row, rowBack] };
    }

    /**
     * Tickets Sub-Menu
     */
    async getTicketsMenu(user, guildId) {
        const settings = await db.getSettings(guildId);

        const embed = createBaseEmbed(user, {
            module: "🛡️ Control Panel > Tickets",
            title: "🎫 Ticket System",
            description: "Configure support category and staff roles.",
            color: Colors.TICKETS
        })
        .addFields(
            { name: "⚙️ Setup Status", value: settings.tickets?.setup ? "✅ Configured" : "❌ Not setup", inline: true },
            { name: "📍 Category", value: settings.tickets?.ticketsCategory ? `<#${settings.tickets.ticketsCategory}>` : "None", inline: true }
        );

        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("dash_main").setLabel("Back to Main Menu").setStyle(ButtonStyle.Primary).setEmoji("🏠")
        );

        return { embeds: [embed], components: [rowBack] };
    }
}

module.exports = new DashboardManager();
