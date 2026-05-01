const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const db = require("../db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure all bot settings for the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // --- Group: Moderation ---
    .addSubcommandGroup(
      (group) =>
        group
          .setName("moderation")
          .setDescription("Configure moderation settings.")
          .addSubcommand((sub) =>
            sub
              .setName("set-moderator-role")
              .setDescription("Set the role that can use the /mod command")
              .addRoleOption((opt) =>
                opt
                  .setName("role")
                  .setDescription("Moderator role")
                  .setRequired(true),
              ),
          )
          .addSubcommand((sub) =>
            sub
              .setName("warn-action-add")
              .setDescription(
                "Set an automatic action for a specific warning count",
              )
              .addIntegerOption((opt) =>
                opt
                  .setName("count")
                  .setDescription("Warning count")
                  .setRequired(true)
                  .setMinValue(1)
                  .setMaxValue(10),
              )
              .addStringOption((opt) =>
                opt
                  .setName("action")
                  .setDescription("Action to take")
                  .setRequired(true)
                  .addChoices(
                    { name: "Kick", value: "kick" },
                    { name: "Ban", value: "ban" },
                    { name: "Mute (10m)", value: "mute_10" },
                    { name: "Mute (30m)", value: "mute_30" },
                    { name: "Mute (1h)", value: "mute_60" },
                    { name: "Mute (1d)", value: "mute_1440" },
                    { name: "Clear Warns", value: "clear_warns" },
                  ),
              ),
          ),
    )
    // --- Group: Logging ---
    .addSubcommandGroup((group) =>
      group
        .setName("logging")
        .setDescription("Configure logging settings.")
        .addSubcommand((sub) =>
          sub
            .setName("set-channel")
            .setDescription("Set the log channel")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("Log channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("category")
            .setDescription("Enable or disable a log category")
            .addStringOption((opt) =>
              opt
                .setName("name")
                .setDescription("Category name")
                .setRequired(true)
                .addChoices(
                  { name: "arrived", value: "arrived" },
                  { name: "farewell", value: "farewell" },
                  { name: "vocal", value: "vocal" },
                  { name: "mod", value: "mod" },
                  { name: "automod", value: "automod" },
                  { name: "commands", value: "commands" },
                  { name: "roles", value: "roles" },
                  { name: "soundboard", value: "soundboard" },
                  { name: "tickets", value: "tickets" },
                  { name: "channels", value: "channels" },
                  { name: "economy", value: "economy" },
                  { name: "bulkdelete", value: "bulkdelete" },
                  { name: "messages", value: "messages" },
                  { name: "invites", value: "invites" },
                ),
            )
            .addBooleanOption((opt) =>
              opt
                .setName("state")
                .setDescription("Enabled status")
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName("enable-all").setDescription("Enable all log categories"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("disable-all")
            .setDescription("Disable all log categories"),
        )
        .addSubcommand((sub) =>
          sub.setName("status").setDescription("Show log configuration status"),
        ),
    )
    // --- Group: Members ---
    .addSubcommandGroup((group) =>
      group
        .setName("members")
        .setDescription("Configure member-related settings.")
        .addSubcommand((sub) =>
          sub
            .setName("autorole")
            .setDescription("Set the role given to new members")
            .addRoleOption((opt) =>
              opt.setName("role").setDescription("Autorole"),
            )
            .addBooleanOption((opt) =>
              opt
                .setName("enabled")
                .setDescription("Enable or disable autorole"),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("welcome")
            .setDescription("Configure welcome message")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("Welcome channel")
                .addChannelTypes(ChannelType.GuildText),
            )
            .addBooleanOption((opt) =>
              opt
                .setName("enabled")
                .setDescription("Enable or disable welcome messages"),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("farewell")
            .setDescription("Configure farewell message")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("Farewell channel")
                .addChannelTypes(ChannelType.GuildText),
            )
            .addBooleanOption((opt) =>
              opt
                .setName("enabled")
                .setDescription("Enable or disable farewell messages"),
            ),
        ),
    )
    // --- Group: Social ---
    .addSubcommandGroup((group) =>
      group
        .setName("social")
        .setDescription("Configure social and marriage settings.")
        .addSubcommand((sub) =>
          sub
            .setName("announcement-channel")
            .setDescription("Set the channel for marriage announcements")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("Announcement channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        ),
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();

    const settings = await db.getSettings(guildId);

    try {
      // --- Moderation Group ---
      if (group === "moderation") {
        if (sub === "set-moderator-role") {
          const role = interaction.options.getRole("role");
          await db.updateSettings(guildId, { moderatorRole: role.id });
          return interaction.reply({
            content: `✅ Moderator role set to <@&${role.id}>.`,
            ephemeral: true,
          });
        }
        if (sub === "set-mute-role") {
          const role = interaction.options.getRole("role");
          await db.updateSettings(guildId, { "automod.muteRoleId": role.id });
          return interaction.reply({
            content: `✅ Mute role set to <@&${role.id}>.`,
            ephemeral: true,
          });
        }
      }

      // --- Warns Group ---
      if (group === "warns") {
        if (sub === "add-action") {
          const count = interaction.options.getInteger("count");
          const action = interaction.options.getString("action");
          await db.updateSettings(guildId, {
            [`warnActions.${count}`]: action,
          });
          return interaction.reply({
            content: `✅ Warn action added: **${count} warns** -> **${action}**.`,
            ephemeral: true,
          });
        }
        if (sub === "remove-action") {
          const count = interaction.options.getInteger("count");
          const GuildSetting = require("../models/GuildSetting.js");
          await GuildSetting.updateOne(
            { guildId },
            { $unset: { [`warnActions.${count}`]: "" } },
          );
          return interaction.reply({
            content: `✅ Warn action for **${count} warns** removed.`,
            ephemeral: true,
          });
        }
        if (sub === "list") {
          const actions = settings.warnActions || new Map();
          if (actions.size === 0)
            return interaction.reply({
              content: "No warn actions configured.",
              ephemeral: true,
            });
          const embed = new EmbedBuilder()
            .setTitle("Warn Actions")
            .setColor(0x00bfff);
          actions.forEach((val, key) =>
            embed.addFields({ name: `${key} warns`, value: val, inline: true }),
          );
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (sub === "reset") {
          await db.updateSettings(guildId, { warnActions: {} });
          return interaction.reply({
            content: "✅ All warn actions have been reset.",
            ephemeral: true,
          });
        }
      }

      // --- Logging Group ---
      if (group === "logging") {
        if (sub === "set-channel") {
          const channel = interaction.options.getChannel("channel");
          await db.updateSettings(guildId, {
            "logs.channel": channel.id,
            "logs.enabled": true,
          });
          return interaction.reply({
            content: `✅ Log channel set to <#${channel.id}>.`,
            ephemeral: true,
          });
        }
        if (sub === "category") {
          const name = interaction.options.getString("name");
          const state = interaction.options.getBoolean("state");
          await db.updateSettings(guildId, {
            [`logs.categories.${name}`]: state,
          });
          return interaction.reply({
            content: `✅ Log category **${name}** is now **${state ? "enabled" : "disabled"}**.`,
            ephemeral: true,
          });
        }
        if (sub === "enable-all") {
          const categories = [
            "arrived",
            "farewell",
            "vocal",
            "mod",
            "automod",
            "commands",
            "roles",
            "soundboard",
            "tickets",
            "channels",
            "economy",
            "bulkdelete",
            "messages",
            "invites",
          ];
          const updates = {};
          categories.forEach((c) => (updates[`logs.categories.${c}`] = true));
          await db.updateSettings(guildId, updates);
          return interaction.reply({
            content: "✅ All log categories enabled.",
            ephemeral: true,
          });
        }
        if (sub === "disable-all") {
          const categories = [
            "arrived",
            "farewell",
            "vocal",
            "mod",
            "automod",
            "commands",
            "roles",
            "soundboard",
            "tickets",
            "channels",
            "economy",
            "bulkdelete",
            "messages",
            "invites",
          ];
          const updates = {};
          categories.forEach((c) => (updates[`logs.categories.${c}`] = false));
          await db.updateSettings(guildId, updates);
          return interaction.reply({
            content: "✅ All log categories disabled.",
            ephemeral: true,
          });
        }
        if (sub === "status") {
          const embed = new EmbedBuilder()
            .setTitle("Log Config Status")
            .setColor(0x00bfff);
          embed.addFields({
            name: "Enabled",
            value: settings.logs?.enabled ? "✅" : "❌",
            inline: true,
          });
          embed.addFields({
            name: "Channel",
            value: settings.logs?.channel
              ? `<#${settings.logs.channel}>`
              : "Not set",
            inline: true,
          });
          const cats = settings.logs?.categories || new Map();
          let catStr = "";
          cats.forEach(
            (val, key) => (catStr += `${val ? "🟢" : "🔴"} ${key}\n`),
          );
          embed.setDescription(catStr || "No categories configured");
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }

      // --- Members Group ---
      if (group === "members") {
        if (sub === "autorole") {
          const role = interaction.options.getRole("role");
          const enabled = interaction.options.getBoolean("enabled");
          const updates = {};
          if (role) updates["autorole.roleId"] = role.id;
          if (enabled !== null) updates["autorole.enabled"] = enabled;
          await db.updateSettings(guildId, updates);
          return interaction.reply({
            content: "✅ Autorole settings updated.",
            ephemeral: true,
          });
        }
        if (sub === "welcome") {
          const channel = interaction.options.getChannel("channel");
          const enabled = interaction.options.getBoolean("enabled");
          const updates = {};
          if (channel) updates["welcome.channel"] = channel.id;
          if (enabled !== null) updates["welcome.enabled"] = enabled;
          await db.updateSettings(guildId, updates);
          return interaction.reply({
            content: "✅ Welcome settings updated.",
            ephemeral: true,
          });
        }
        if (sub === "farewell") {
          const channel = interaction.options.getChannel("channel");
          const enabled = interaction.options.getBoolean("enabled");
          const updates = {};
          if (channel) updates["farewell.channel"] = channel.id;
          if (enabled !== null) updates["farewell.enabled"] = enabled;
          await db.updateSettings(guildId, updates);
          return interaction.reply({
            content: "✅ Farewell settings updated.",
            ephemeral: true,
          });
        }
      }

      // --- Social Group ---
      if (group === "social") {
        if (sub === "announcement-channel") {
          const channel = interaction.options.getChannel("channel");
          await db.updateSettings(guildId, {
            "marriageConfig.announcementChannel": channel.id,
          });
          return interaction.reply({
            content: `✅ Marriage announcement channel set to <#${channel.id}>.`,
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      console.error("Config command error:", error);
      await interaction.reply({
        content: "❌ An error occurred during configuration.",
        ephemeral: true,
      });
    }
  },
};
