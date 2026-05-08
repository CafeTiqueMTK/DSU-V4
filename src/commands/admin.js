const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  REST,
  Routes,
} = require("discord.js");
const db = require("../db.js");
const path = require("path");
const { config } = require("../utils/env.js");
const { createBaseEmbed, success, error, info, Emojis, Colors } = require("../utils/embeds");

module.exports = [
  // --- DASHBOARD ---
  {
    data: new SlashCommandBuilder()
      .setName("dashboard")
      .setDescription("Interactive bot configuration dashboard")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const embed = createBaseEmbed(interaction.user, { module: "🛡️ Admin System",
        title: "📊 Bot Dashboard",
        description: "Welcome to the interactive configuration dashboard. Select a module below to configure its settings.",
        color: Colors.ADMIN,
      })
      .addFields(
        { name: "🛡️ Moderation", value: "Configure logs, automod, and permissions.", inline: true },
        { name: "💰 Economy", value: "Manage currency, daily rewards, and work.", inline: true },
        { name: "🎫 Tickets", value: "Setup support system and categories.", inline: true }
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("dash_mod")
          .setLabel("Moderation")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🛡️"),
        new ButtonBuilder()
          .setCustomId("dash_eco")
          .setLabel("Economy")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("💰"),
        new ButtonBuilder()
          .setCustomId("dash_tickets")
          .setLabel("Tickets")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🎫"),
      );
      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 64,
      });
    },
  },

  // --- EMBED BUILDER ---
  {
    data: new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Send a custom embed")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("The channel to send the embed in")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const channel = interaction.options.getChannel("channel");
      const modal = new ModalBuilder()
        .setCustomId(`embedModal:${channel.id}`)
        .setTitle("Create Custom Embed");
      const title = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Title")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Enter the embed title...")
        .setRequired(true);
      const desc = new TextInputBuilder()
        .setCustomId("desc")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Enter the main content...")
        .setRequired(true);
      const color = new TextInputBuilder()
        .setCustomId("color")
        .setLabel("Color (Hex)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("#3498db")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(title),
        new ActionRowBuilder().addComponents(desc),
        new ActionRowBuilder().addComponents(color),
      );
      await interaction.showModal(modal);
    },
  },

  // --- RELOAD ---
  {
    data: new SlashCommandBuilder()
      .setName("reload")
      .setDescription("Reload commands")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const { loadCommands } = require("../utils/commandLoader.js");
      const commandsPath = path.join(process.cwd(), "src", "commands");
      interaction.client.commands.clear();
      const { commandsArray } = loadCommands(interaction.client, commandsPath, {
        clearCache: true,
      });
      const rest = new REST({ version: "10" }).setToken(config.token);
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: commandsArray,
      });
      
      const embed = success(interaction.user, `Successfully reloaded **${commandsArray.length}** commands across all categories.`, "System Reloaded", "🛡️ Admin System");
      await interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    },
  },

  // --- BOT RESET ---
  {
    data: new SlashCommandBuilder()
      .setName("botreset")
      .setDescription("Reset server config")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const warningEmbed = createBaseEmbed(interaction.user, { module: "🛡️ Admin System",
        title: "⚠️ Dangerous Action",
        description: "Are you absolutely sure you want to reset all server configurations? This action is **irreversible**.\n\nType `YES` to confirm.",
        color: Colors.ERROR,
      });

      await interaction.reply({
        embeds: [warningEmbed],
        flags: 64,
      });

      const coll = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        max: 1,
        time: 30000,
      });
      coll.on("collect", async (m) => {
        if (m.content.toUpperCase() === "YES") {
          const GuildSetting = require("../models/GuildSetting.js");
          await GuildSetting.findOneAndDelete({
            guildId: interaction.guild.id,
          });
          const resetEmbed = success(interaction.user, "All server configurations have been reset to default values.", "Reset Complete", "🛡️ Admin System");
          await interaction.followUp({
            embeds: [resetEmbed],
            flags: 64,
          });
        }
      });
    },
  },

  // --- OWNER COMMANDS ---
  {
    data: new SlashCommandBuilder()
      .setName("own")
      .setDescription("Owner only tools")
      .addSubcommand((sub) =>
        sub.setName("guilds").setDescription("List guilds"),
      ),
    async execute(interaction) {
      if (interaction.user.id !== config.ownerId)
        return interaction.reply({ embeds: [error(interaction.user, "This command is restricted to the bot owner.", "Error", "🛡️ Admin System")], flags: 64 });
      
      const guilds = interaction.client.guilds.cache
        .map((g) => `• **${g.name}** (\`${g.id}\`) - ${g.memberCount} members`)
        .join("\n");
      
      const embed = createBaseEmbed(interaction.user, { module: "🛡️ Admin System",
        title: "🛡️ Owner: Guild List",
        description: guilds || "The bot is not in any servers.",
        color: Colors.ADMIN,
      });
      await interaction.reply({ embeds: [embed], flags: 64 });
    },
  },

  // --- UPDATE (GitHub Notifications) ---
  {
    data: new SlashCommandBuilder()
      .setName("update")
      .setDescription("GitHub update notifications")
      .addSubcommand((sub) =>
        sub.setName("status").setDescription("Check status"),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const updateConfig = (await db.get("updates.json")) || {};
      const guildUpdateConfig = updateConfig[interaction.guild.id] || { enabled: false };
      
      const embed = info(interaction.user, `GitHub update notifications are currently **${guildUpdateConfig.enabled ? "enabled" : "disabled"}**.`, "Update Status", "🛡️ Admin System")
        .setColor(guildUpdateConfig.enabled ? Colors.SUCCESS : Colors.ERROR);
      
      await interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    },
  },
];
