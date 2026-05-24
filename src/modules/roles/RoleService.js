const { success, error } = require("../../utils/embeds");

class RoleService {
  constructor(db) {
    this.db = db;
  }

  async handleReactionRole(interaction) {
    const { guild, user, customId } = interaction;
    const roleId = customId.replace("reaction_role_", "");
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      return interaction.reply({
        embeds: [error(user, "The requested role could not be found.", "Error", "🎭 Reaction Roles")],
        flags: 64,
      });
    }

    try {
      if (interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(role);
        await interaction.reply({
          embeds: [success(user, `The role **${role.name}** has been removed.`, "Role Removed", "🎭 Reaction Roles")],
          flags: 64,
        });
      } else {
        await interaction.member.roles.add(role);
        await interaction.reply({
          embeds: [success(user, `The role **${role.name}** has been added.`, "Role Added", "🎭 Reaction Roles")],
          flags: 64,
        });
      }
    } catch (e) {
      await interaction.reply({
        embeds: [error(user, "Failed to update your roles. Please check the bot's permissions.", "Error", "🎭 Reaction Roles")],
        flags: 64,
      });
    }
  }
}

module.exports = RoleService;
