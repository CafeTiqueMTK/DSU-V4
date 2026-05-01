const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const db = require("../db.js");

module.exports = [
  // --- INFO (User, Server, Bot, Status) ---
  {
    data: new SlashCommandBuilder()
      .setName("info")
      .setDescription("General information")
      .addSubcommand((sub) => sub.setName("user").addUserOption((o) => o.setName("user").setRequired(true)))
      .addSubcommand((sub) => sub.setName("server").setDescription("Server info"))
      .addSubcommand((sub) => sub.setName("bot").setDescription("Bot info")),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      if (sub === "user") {
        const user = interaction.options.getUser("user");
        const embed = new EmbedBuilder().setTitle(`User: ${user.tag}`).setThumbnail(user.displayAvatarURL()).setColor(0x00bfff);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "server") {
        const embed = new EmbedBuilder().setTitle(`Server: ${interaction.guild.name}`).setColor(0x00ff99);
        await interaction.reply({ embeds: [embed] });
      } else if (sub === "bot") {
        const embed = new EmbedBuilder().setTitle("DSU Bot").setDescription("V4.0.0").setColor(0x00bfff);
        await interaction.reply({ embeds: [embed] });
      }
    },
  },

  // --- SOCIAL (Marriage, Interactions) ---
  {
    data: new SlashCommandBuilder()
      .setName("social")
      .setDescription("Social interactions")
      .addSubcommand((sub) => sub.setName("marry").addUserOption((o) => o.setName("user").setRequired(true)))
      .addSubcommand((sub) => sub.setName("hug").addUserOption((o) => o.setName("user").setRequired(true))),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const target = interaction.options.getUser("user");
      if (sub === "hug") {
        await interaction.reply({ content: `🤗 **${interaction.user}** hugs **${target}**!` });
      } else if (sub === "marry") {
        await interaction.reply({ content: `💍 **${interaction.user}** proposed to **${target}**!` });
      }
    },
  },
];
