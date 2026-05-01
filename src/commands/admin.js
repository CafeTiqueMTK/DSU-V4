const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
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

module.exports = [
  // --- DASHBOARD ---
  {
    data: new SlashCommandBuilder()
      .setName("dashboard")
      .setDescription("Interactive bot configuration dashboard")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const settings = await db.getSettings(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setTitle("📊 Bot Dashboard")
        .setDescription("Configure your bot modules here.")
        .setColor(0x00bfff);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("dash_mod").setLabel("Moderation").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("dash_eco").setLabel("Economy").setStyle(ButtonStyle.Secondary),
      );
      await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
      // Note: Collector logic would be here, similar to original dashboard.js
    },
  },

  // --- EMBED BUILDER ---
  {
    data: new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Send a custom embed")
      .addChannelOption((opt) => opt.setName("channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const channel = interaction.options.getChannel("channel");
      const modal = new ModalBuilder().setCustomId(`embedModal:${channel.id}`).setTitle("Create Embed");
      const title = new TextInputBuilder().setCustomId("title").setLabel("Title").setStyle(TextInputStyle.Short).setRequired(true);
      const desc = new TextInputBuilder().setCustomId("desc").setLabel("Description").setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(title), new ActionRowBuilder().addComponents(desc));
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
      const { commandsArray } = loadCommands(interaction.client, commandsPath, { clearCache: true });
      const rest = new REST({ version: "10" }).setToken(config.token);
      await rest.put(Routes.applicationCommands(config.clientId), { body: commandsArray });
      await interaction.reply({ content: `✅ Reloaded ${commandsArray.length} commands.`, flags: 64 });
    },
  },

  // --- BOT RESET ---
  {
    data: new SlashCommandBuilder()
      .setName("botreset")
      .setDescription("Reset server config")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      await interaction.reply({ content: "⚠️ Are you sure? Type `YES` to confirm.", flags: 64 });
      const coll = interaction.channel.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, max: 1, time: 30000 });
      coll.on("collect", async (m) => {
        if (m.content.toUpperCase() === "YES") {
          const GuildSetting = require("../models/GuildSetting.js");
          await GuildSetting.findOneAndDelete({ guildId: interaction.guild.id });
          await interaction.followUp({ content: "♻️ Server config reset.", flags: 64 });
        }
      });
    },
  },

  // --- OWNER COMMANDS ---
  {
    data: new SlashCommandBuilder()
      .setName("own")
      .setDescription("Owner only tools")
      .addSubcommand((sub) => sub.setName("guilds").setDescription("List guilds")),
    async execute(interaction) {
      if (interaction.user.id !== config.ownerId) return interaction.reply({ content: "Owner only.", flags: 64 });
      const guilds = interaction.client.guilds.cache.map((g) => `${g.name} (${g.id})`).join("\n");
      await interaction.reply({ content: `Servers:\n${guilds}`, flags: 64 });
    },
  },

  // --- UPDATE (GitHub Notifications) ---
  {
    data: new SlashCommandBuilder()
      .setName("update")
      .setDescription("GitHub update notifications")
      .addSubcommand((sub) => sub.setName("status").setDescription("Check status"))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const updateConfig = await db.get("updates.json") || {};
      const config = updateConfig[interaction.guild.id] || { enabled: false };
      await interaction.reply({ content: `Updates are currently ${config.enabled ? "enabled" : "disabled"}.`, flags: 64 });
    },
  },
];
