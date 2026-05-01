const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const db = require("../db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Reaction roles system")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .addChannelOption((o) => o.setName("channel").setRequired(true))
        .addStringOption((o) => o.setName("title").setRequired(true))
        .addRoleOption((o) => o.setName("role").setRequired(true))
        .addStringOption((o) => o.setName("label").setRequired(true)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const title = interaction.options.getString("title");
      const role = interaction.options.getRole("role");
      const label = interaction.options.getString("label");

      const embed = new EmbedBuilder().setTitle(title).setDescription(`Get the <@&${role.id}> role.`).setColor(0x00ff99);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rr_${role.id}`).setLabel(label).setStyle(ButtonStyle.Primary),
      );

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: "✅ Reaction role setup complete.", flags: 64 });
    }
  },
};
