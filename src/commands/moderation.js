const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const db = require("../db.js");
const { success, error, Colors, Emojis } = require("../utils/embeds.js");

module.exports = [
  // --- MAIN MOD COMMAND (ban, kick, warn, mute) ---
  {
    requiresDb: true,
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
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const reason =
        interaction.options.getString("reason") || "No reason specified";
      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member && sub !== "ban") {
        return interaction.reply({
          embeds: [error(interaction.user, "User not found on this server.", "Error", "🔨 Moderation System")],
          flags: 64,
        });
      }

      if (sub === "ban") {
        if (
          !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)
        ) {
          return interaction.reply({
            embeds: [
              error(
                interaction.user,
                "You lack Ban permissions.",
                "Error",
                "🔨 Moderation System",
              ),
            ],
            flags: 64,
          });
        }

        // Send DM notification
        const dmEmbed = new EmbedBuilder()
          .setTitle(`🔨 Ban Applied`)
          .setDescription(
            `You have been banned from **${interaction.guild.name}**.`,
          )
          .addFields({ name: "Reason", value: reason, inline: true })
          .setColor(Colors.BAN)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(async () => {
          await interaction.channel
            .send({
              content: `<@${user.id}>, your DMs are closed.`,
              embeds: [dmEmbed],
            })
            .catch(() => {});
        });

        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        await interaction.reply({
          embeds: [
            createBaseEmbed(interaction.user, {
              title: "🔨 Ban Applied",
              description: `**${user.tag}** has been banned.`,
              color: Colors.BAN,
              module: "🔨 Moderation System",
            }),
          ],
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
        // Send DM notification
        const dmEmbed = new EmbedBuilder()
          .setTitle(`🔨 Kick Applied`)
          .setDescription(
            `You have been kicked from **${interaction.guild.name}**.`,
          )
          .addFields({ name: "Reason", value: reason, inline: true })
          .setColor(Colors.NON_FATAL)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(async () => {
          await interaction.channel
            .send({
              content: `<@${user.id}>, your DMs are closed.`,
              embeds: [dmEmbed],
            })
            .catch(() => {});
        });

        await member.kick(reason).catch(() => {});
        await interaction.reply({
          embeds: [
            createBaseEmbed(interaction.user, {
              title: "🔨 Kick Applied",
              description: `**${user.tag}** has been kicked.`,
              color: Colors.NON_FATAL,
              module: "🔨 Moderation System",
            }),
          ],
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

        // Send DM notification
        const dmEmbed = new EmbedBuilder()
          .setTitle(`${Emojis.WARNING} Warning Received`)
          .setDescription(
            `You have received a warning on **${interaction.guild.name}**.`,
          )
          .addFields(
            { name: "Reason", value: reason, inline: true },
            {
              name: "Total Warnings",
              value: warns.length.toString(),
              inline: true,
            },
          )
          .setColor(Colors.WARNING)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(async () => {
          await interaction.channel
            .send({
              content: `<@${user.id}>, your DMs are closed.`,
              embeds: [dmEmbed],
            })
            .catch(() => {});
        });

        await interaction.reply({
          embeds: [
            success(
              interaction.user,
              `**${user.tag}** has been warned.\nTotal warnings: **${warns.length}**`,
              "Warn Applied",
              "🔨 Moderation System",
            ),
          ],
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
            embeds: [
              error(
                interaction.user,
                'No "mute" role found. Please create one named "mute".',
                "Error",
                "🔨 Moderation System",
              ),
            ],
            flags: 64,
          });

        // Send DM notification
        const dmEmbed = new EmbedBuilder()
          .setTitle(`🔨 Mute Applied`)
          .setDescription(
            `You have been muted on **${interaction.guild.name}** for **${duration}m**.`,
          )
          .addFields({ name: "Reason", value: reason, inline: true })
          .setColor(Colors.NON_FATAL)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(async () => {
          await interaction.channel
            .send({
              content: `<@${user.id}>, your DMs are closed.`,
              embeds: [dmEmbed],
            })
            .catch(() => {});
        });

        await member.roles.add(muteRole, reason).catch(() => {});
        await interaction.reply({
          embeds: [
            createBaseEmbed(interaction.user, {
              title: "🔨 Mute Applied",
              description: `**${user.tag}** has been muted for **${duration}m**.`,
              color: Colors.NON_FATAL,
              module: "🔨 Moderation System",
            }),
          ],
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
    requiresDb: true,
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
          embeds: [error(interaction.user, "You lack Ban permissions.", "Error", "🔨 Moderation System")],
          flags: 64,
        });
      }
      const userId = interaction.options.getString("userid");
      const reason =
        interaction.options.getString("reason") || "No reason provided";
      try {
        await interaction.guild.members.unban(userId, reason);
        await interaction.reply({ embeds: [success(interaction.user, `User \`${userId}\` has been unbanned.`, "Unban Successful", "🔨 Moderation System")] });
        await db.logModAction(
          interaction.guild,
          userId,
          "Unban",
          reason,
          interaction.user,
        );
      } catch {
        await interaction.reply({
          embeds: [error(interaction.user, "Error unbanning user. Check if the ID is correct.", "Error", "🔨 Moderation System")],
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
        return interaction.reply({ embeds: [error(interaction.user, "User not found.", "Error", "🔨 Moderation System")], flags: 64 });
      const muteRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "mute",
      );
      if (!muteRole)
        return interaction.reply({
          embeds: [error(interaction.user, 'No "mute" role found.', "Error", "🔨 Moderation System")],
          flags: 64,
        });
      await member.roles
        .remove(muteRole, `Unmuted by ${interaction.user.tag}`)
        .catch(() => {});
      await interaction.reply({
        embeds: [success(interaction.user, `<@${member.id}> has been unmuted.`, "Unmute Successful", "🔨 Moderation System")],
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
              .setDescription("The channel to purge")
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
              .setDescription("The channel to purge bot messages from")
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
          embeds: [success(interaction.user, `Successfully purged **${toDelete.size}** messages.`, "Purge Successful", "🔨 Moderation System")],
        });
      } catch (e) {
        await interaction.editReply({ embeds: [error(interaction.user, e.message, "Error", "🔨 Moderation System")] });
      }
    },
  },

  // --- CLEARMSG (User specific purge) ---
  {
    data: new SlashCommandBuilder()
      .setName("clearmsg")
      .setDescription("Delete the last messages from a user")
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("The user whose messages to delete")
          .setRequired(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName("count")
          .setDescription("Number of messages to delete")
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true),
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
        embeds: [success(interaction.user, `Deleted **${toDelete.length}** messages from **${user.tag}**.`, "Clear Messages", "🔨 Moderation System")],
        flags: 64,
      });
    },
  },

  // --- DM ---
  {
    data: new SlashCommandBuilder()
      .setName("dm")
      .setDescription("Send a private message to a user.")
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("The user to DM")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("message")
          .setDescription("The message to send")
          .setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const user = interaction.options.getUser("user");
      const message = interaction.options.getString("message");
      try {
        await user.send(message);
        await interaction.reply({
          embeds: [
            success(
              interaction.user,
              `Message sent to **${user.tag}**.`,
              "DM Sent",
              "🔨 Moderation System",
            ),
          ],
          flags: 64,
        });
      } catch {
        await interaction.channel
          .send({
            content: `<@${user.id}>, your DMs are closed. Message from ${interaction.user.tag}:`,
            description: message,
          })
          .catch(() => {});

        await interaction.reply({
          embeds: [
            info(
              interaction.user,
              `Unable to DM **${user.tag}**. The message has been sent in the current channel instead.`,
              "DM Fallback",
              "🔨 Moderation System",
            ),
          ],
          flags: 64,
        });
      }
    },
  },

  // --- CLEARWARN ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("clearwarn")
      .setDescription("Delete all warnings for a user")
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("The user whose warnings to clear")
          .setRequired(true),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guild.id;
      const warns = await db.getWarns(guildId, user.id);
      if (warns.length === 0)
        return interaction.reply({ embeds: [error(interaction.user, "No warnings found for this user.", "Error", "🔨 Moderation System")], flags: 64 });
      await db.clearWarns(guildId, user.id);
      await interaction.reply({
        embeds: [success(interaction.user, `Warnings cleared for **${user.tag}**.`, "Warnings Cleared", "🔨 Moderation System")],
        flags: 64,
      });
    },
  },
];
