const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/guildManager");

module.exports = [
  // --- MAIN AUTOMOD CONFIG ---
  {
    data: new SlashCommandBuilder()
      .setName("automod")
      .setDescription("Configure Automod")
      .addSubcommand((sub) => sub.setName("status").setDescription("Show status"))
      .addSubcommand((sub) =>
        sub
          .setName("channel")
          .setDescription("Action channel")
          .addChannelOption((o) => o.setName("channel").addChannelTypes(ChannelType.GuildText).setRequired(true)),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;
      const settings = getGuildData(guildId, "settings");
      if (!settings[guildId]) settings[guildId] = {};
      if (sub === "status") {
        const enabled = settings[guildId].automod?.enabled;
        await interaction.reply({ content: `Automod is ${enabled ? "enabled" : "disabled"}.`, flags: 64 });
      } else if (sub === "channel") {
        const channel = interaction.options.getChannel("channel");
        if (!settings[guildId].automod) settings[guildId].automod = {};
        settings[guildId].automod.actionChannel = channel.id;
        saveGuildData(guildId, settings, "settings");
        await interaction.reply({ content: `Action channel set to <#${channel.id}>.`, flags: 64 });
      }
    },
  },

  // --- SHIELD (Protection Toggles) ---
  {
    data: new SlashCommandBuilder()
      .setName("shield")
      .setDescription("Anti-raid/spam shields")
      .addSubcommand((sub) =>
        sub
          .setName("spam")
          .addStringOption((o) =>
            o.setName("state").setRequired(true).addChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("raid")
          .addStringOption((o) =>
            o.setName("state").setRequired(true).addChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const state = interaction.options.getString("state") === "enable";
      const guildId = interaction.guild.id;
      const settings = getGuildData(guildId, "settings");
      if (!settings[guildId]) settings[guildId] = {};
      if (sub === "spam") {
        if (!settings[guildId].antiSpam) settings[guildId].antiSpam = {};
        settings[guildId].antiSpam.enabled = state;
      } else if (sub === "raid") {
        if (!settings[guildId].antiRaid) settings[guildId].antiRaid = {};
        settings[guildId].antiRaid.enabled = state;
      }
      saveGuildData(guildId, settings, "settings");
      await interaction.reply({ content: `${sub} shield ${state ? "enabled" : "disabled"}.`, flags: 64 });
    },
  },

  // --- KEYWORDS ---
  {
    data: new SlashCommandBuilder()
      .setName("keywords")
      .setDescription("Blacklisted words")
      .addSubcommand((sub) => sub.setName("add").addStringOption((o) => o.setName("word").setRequired(true)))
      .addSubcommand((sub) => sub.setName("list").setDescription("List words"))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;
      const settings = getGuildData(guildId, "settings");
      if (!settings[guildId]) settings[guildId] = {};
      if (!settings[guildId].antiKeywords) settings[guildId].antiKeywords = { keywords: [] };
      if (sub === "add") {
        const word = interaction.options.getString("word").toLowerCase();
        if (!settings[guildId].antiKeywords.keywords.includes(word)) {
          settings[guildId].antiKeywords.keywords.push(word);
          saveGuildData(guildId, settings, "settings");
        }
        await interaction.reply({ content: `Added "${word}" to blacklist.`, flags: 64 });
      } else if (sub === "list") {
        const list = settings[guildId].antiKeywords.keywords.join(", ") || "None";
        await interaction.reply({ content: `Blacklisted: ${list}`, flags: 64 });
      }
    },
  },
];
