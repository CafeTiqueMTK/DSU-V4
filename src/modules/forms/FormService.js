const { PermissionFlagsBits } = require("discord.js");
const { createBaseEmbed, success, error, Colors } = require("../../utils/embeds");

class FormService {
  constructor(db) {
    this.db = db;
  }

  async handleEmbedModal(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [error(interaction.user, "You lack permissions to send embeds via this system.", "Permission Denied", "🛡️ Security System")],
        flags: 64,
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
  }
}

module.exports = FormService;
