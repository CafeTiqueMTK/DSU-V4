const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const { createBaseEmbed, success, Colors } = require("../utils/embeds");

module.exports = {
  requiresDb: true,
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the ticket system")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("The channel where the ticket button will be sent")
            .setRequired(true),
        )
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("The support role to be pinged")
            .setRequired(true),
        )
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("The category where tickets will be created")
            .setRequired(true),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      const category = interaction.options.getChannel("category");

      const embed = createBaseEmbed(interaction.user, { module: "🎫 Ticket System",
        title: "🎫 Support Tickets",
        description: "Need help? Click the button below to open a private support ticket. Our team will assist you as soon as possible.",
        color: Colors.INFO,
      })
      .addFields(
        { name: "🛡️ Support Team", value: `${role}`, inline: true },
        { name: "📍 Category", value: `${category.name}`, inline: true }
      );

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("Open a Ticket")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🎫"),
      );

      await channel.send({ embeds: [embed], components: [btn] });
      await interaction.reply({
        embeds: [success(interaction.user, `Ticket system has been successfully set up in ${channel}.`, "Setup Complete", "🎫 Ticket System")],
        flags: 64,
      });
    }
  },
};
