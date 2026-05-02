const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const db = require("../db.js");

module.exports = [
  // --- MAIN MOD COMMAND (ban, kick, warn, mute) ---
  {
    data: new SlashCommandBuilder()
      .setName("mod")
      .setDescription("Moderation commands (ban, kick, warn, mute)")
      .addSubcommand((sub) =>
        sub
          .setName("ban")
          .setDescription("Ban a user")
          .addUserOption((opt) =>
            opt.setName("user").setDescription("User to ban").setRequired(true),
          )
          .addStringOption((opt) =>
            opt.setName("reason").setDescription("Reason for ban"),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("kick")
          .setDescription("Kick a user")
          .addUserOption((opt) =>
            opt
              .setName("user")
              .setDescription("User to kick")
              .setRequired(true),
          )
          .addStringOption((opt) =>
            opt.setName("reason").setDescription("Reason for kick"),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("warn")
          .setDescription("Warn a user")
          .addUserOption((opt) =>
            opt
              .setName("user")
              .setDescription("User to warn")
              .setRequired(true),
          )
          .addStringOption((opt) =>
            opt.setName("reason").setDescription("Reason for warn"),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("mute")
          .setDescription("Mute a user")
          .addUserOption((opt) =>
            opt
              .setName("user")
              .setDescription("User to mute")
              .setRequired(true),
          )
          .addIntegerOption((opt) =>
            opt
              .setName("duration")
              .setDescription("Duration in minutes")
              .setMinValue(1)
              .setMaxValue(1440),
          )
          .addStringOption((opt) =>
            opt.setName("reason").setDescription("Reason for mute"),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const guildId = interaction.guild.id;
      const settings = await db.getSettings(guildId);
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const reason =
        interaction.options.getString("reason") || "No reason specified";
      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member && sub !== "ban") {
        return interaction.reply({
          content: "User not found on this server.",
          flags: 64,
        });
      }

      if (sub === "ban") {
        if (
          !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)
        ) {
          return interaction.reply({
            content: "You lack Ban permissions.",
            flags: 64,
          });
        }
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        await interaction.reply({
          content: `✅ **${user.tag}** has been banned.`,
          flags: 64,
        });
        await db.logModAction(
          interaction.guild,
          user.tag,
          "Ban",
          reason,
          interaction.user,
        );
      } else if (sub === "kick") {
        await member.kick(reason).catch(() => {});
        await interaction.reply({
          content: `✅ **${user.tag}** has been kicked.`,
          flags: 64,
        });
        await db.logModAction(
          interaction.guild,
          user.tag,
          "Kick",
          reason,
          interaction.user,
        );
      } else if (sub === "warn") {
        await db.addWarn(guildId, user.id, interaction.user.id, reason);
        const warns = await db.getWarns(guildId, user.id);
        await interaction.reply({
          content: `✅ **${user.tag}** warned. Total: ${warns.length}`,
          flags: 64,
        });
        await db.logModAction(
          interaction.guild,
          user.tag,
          "Warn",
          reason,
          interaction.user,
          [{ name: "Count", value: warns.length.toString(), inline: true }],
        );
      } else if (sub === "mute") {
        const duration = interaction.options.getInteger("duration") || 10;
        const muteRole = interaction.guild.roles.cache.find(
          (r) => r.name.toLowerCase() === "mute",
        );
        if (!muteRole)
          return interaction.reply({
            content: 'No "mute" role found.',
            flags: 64,
          });
        await member.roles.add(muteRole, reason).catch(() => {});
        await interaction.reply({
          content: `✅ **${user.tag}** muted for ${duration}m.`,
          flags: 64,
        });
        await db.logModAction(
          interaction.guild,
          user.tag,
          "Mute",
          reason,
          interaction.user,
          [{ name: "Duration", value: `${duration}m`, inline: true }],
        );
        setTimeout(async () => {
          const m = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);
          if (m && m.roles.cache.has(muteRole.id))
            await m.roles.remove(muteRole, "End of mute").catch(() => {});
        }, duration * 60000);
      }
    },
  },

  // --- UNBAN ---
  {
    data: new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Unban a user by their ID")
      .addStringOption((opt) =>
        opt.setName("userid").setDescription("User ID").setRequired(true),
      )
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({
          content: "You lack Ban permissions.",
          flags: 64,
        });
      }
      const userId = interaction.options.getString("userid");
      const reason =
        interaction.options.getString("reason") || "No reason provided";
      try {
        await interaction.guild.members.unban(userId, reason);
        await interaction.reply({ content: `✅ User \`${userId}\` unbanned.` });
        await db.logModAction(
          interaction.guild,
          userId,
          "Unban",
          reason,
          interaction.user,
        );
      } catch {
        await interaction.reply({
          content: "❌ Error unbanning user.",
          flags: 64,
        });
      }
    },
  },

  // --- UNMUTE ---
  {
    data: new SlashCommandBuilder()
      .setName("unmute")
      .setDescription("Remove the mute from a user")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("User to unmute").setRequired(true),
      ),
    async execute(interaction) {
      const member = interaction.options.getMember("user");
      if (!member)
        return interaction.reply({ content: "User not found.", flags: 64 });
      const muteRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "mute",
      );
      if (!muteRole)
        return interaction.reply({
          content: 'No "mute" role found.',
          flags: 64,
        });
      await member.roles
        .remove(muteRole, `Unmuted by ${interaction.user.tag}`)
        .catch(() => {});
      await interaction.reply({
        content: `🔊 <@${member.id}> has been unmuted.`,
      });
    },
  },

  // --- PURGE ---
  {
    data: new SlashCommandBuilder()
      .setName("purge")
      .setDescription("Delete messages in a channel")
      .addSubcommand((sub) =>
        sub
          .setName("all")
          .setDescription("Delete all messages")
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("bot")
          .setDescription("Delete only bot messages")
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const channel = interaction.options.getChannel("channel");
      await interaction.deferReply({ flags: 64 });
      try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const now = Date.now();
        const toDelete = messages.filter((m) => {
          const age = now - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000;
          return sub === "bot" ? m.author.bot && age : age;
        });
        await channel.bulkDelete(toDelete, true);
        await interaction.editReply({
          content: `✅ Purged ${toDelete.size} messages.`,
        });
      } catch (e) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    },
  },

  // --- CLEARMSG (User specific purge) ---
  {
    data: new SlashCommandBuilder()
      .setName("clearmsg")
      .setDescription("Delete the last messages from a user")
      .addUserOption((opt) => opt.setName("user").setRequired(true))
      .addIntegerOption((opt) =>
        opt.setName("count").setMinValue(1).setMaxValue(100).setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
      const user = interaction.options.getUser("user");
      const count = interaction.options.getInteger("count");
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const toDelete = messages
        .filter((m) => m.author.id === user.id)
        .first(count);
      await interaction.channel.bulkDelete(toDelete, true);
      await interaction.reply({
        content: `🧹 Deleted ${toDelete.length} messages from ${user.tag}.`,
        flags: 64,
      });
    },
  },

  // --- DM ---
  {
    data: new SlashCommandBuilder()
      .setName("dm")
      .setDescription("Send a private message to a user.")
      .addUserOption((opt) => opt.setName("user").setRequired(true))
      .addStringOption((opt) => opt.setName("message").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const user = interaction.options.getUser("user");
      const message = interaction.options.getString("message");
      try {
        await user.send(message);
        await interaction.reply({
          content: `📩 Message sent to ${user.tag}.`,
          flags: 64,
        });
      } catch {
        await interaction.reply({
          content: `❌ Unable to DM ${user.tag}.`,
          flags: 64,
        });
      }
    },
  },

  // --- CLEARWARN ---
  {
    data: new SlashCommandBuilder()
      .setName("clearwarn")
      .setDescription("Delete all warnings for a user")
      .addUserOption((opt) => opt.setName("user").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guild.id;
      const warns = await db.getWarns(guildId, user.id);
      if (warns.length === 0)
        return interaction.reply({ content: "No warnings found.", flags: 64 });
      await db.clearWarns(guildId, user.id);
      await interaction.reply({
        content: `🧹 Warnings cleared for **${user.tag}**.`,
        flags: 64,
      });
    },
  },
];
