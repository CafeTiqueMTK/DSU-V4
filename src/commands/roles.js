const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("../db.js");
const { createBaseEmbed, success, Colors } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Reaction roles system")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up a reaction role")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("The channel for the reaction role message")
            .setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName("title")
            .setDescription("The title of the embed")
            .setRequired(true),
        )
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("The role to give")
            .setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName("label")
            .setDescription("The text on the button")
            .setRequired(true),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const title = interaction.options.getString("title");
      const role = interaction.options.getRole("role");
      const label = interaction.options.getString("label");

      const embed = createBaseEmbed(interaction.user, {
        title: title,
        description: `Click the button below to receive or remove the ${role} role.`,
        color: Colors.INFO,
      });
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`reaction_role_${role.id}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary),
      );

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        embeds: [success(interaction.user, `Reaction role for ${role} has been set up in ${channel}.`, "Setup Complete")],
        flags: 64,
      });
    }
  },
};
