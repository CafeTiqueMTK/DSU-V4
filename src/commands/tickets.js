const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const db = require("../db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .addChannelOption((o) => o.setName("channel").setRequired(true))
        .addRoleOption((o) => o.setName("role").setRequired(true))
        .addChannelOption((o) => o.setName("category").setRequired(true)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      const category = interaction.options.getChannel("category");

      const embed = new EmbedBuilder().setTitle("Support Tickets").setDescription("Click below to open a ticket.").setColor(0x00ff99);
      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("create_ticket").setLabel("Open Ticket").setStyle(ButtonStyle.Primary).setEmoji("🎫"),
      );

      await channel.send({ embeds: [embed], components: [btn] });
      await interaction.reply({ content: "✅ Ticket system setup complete.", flags: 64 });
    }
  },
};
