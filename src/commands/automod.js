const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const db = require("../db.js");
const { info, success, Colors } = require("../utils/embeds");

module.exports = [
  // --- MAIN AUTOMOD CONFIG ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("automod")
      .setDescription("Configure Automod settings and channels")
      .addSubcommand((sub) =>
        sub.setName("status").setDescription("Show the current status of all protections"),
      )
      .addSubcommand((sub) =>
        sub.setName("enable").setDescription("Enable global automod system"),
      )
      .addSubcommand((sub) =>
        sub.setName("disable").setDescription("Disable global automod system"),
      )
      .addSubcommand((sub) =>
        sub
          .setName("infochannel")
          .setDescription("Set the action channel for automod logs")
          .addChannelOption((o) =>
            o
              .setName("channel")
              .setDescription("The channel for automod actions")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("safechannel")
          .setDescription("Manage channels exempted from automod checks")
          .addChannelOption((o) =>
            o
              .setName("channel")
              .setDescription("The channel to toggle")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;
      const settings = await db.getSettings(guildId);

      if (sub === "status") {
        const enabled = settings.automod?.enabled;
        const ghostPing = settings.automod?.categories?.ghostPing?.enabled;
        const invChars = settings.automod?.categories?.invisibleChars?.enabled;
        const antiLink = settings.antiLinks?.enabled;
        const antiInvite = settings.antiInvites?.enabled;
        const antiRole = settings.antiRoles?.enabled;
        const antiSpam = settings.antiSpam?.enabled;
        const antiRaid = settings.antiRaid?.enabled;
        const antiNsfw = settings.antiNsfw?.enabled;

        const statusText = [
            `🛡️ **Core Status**`,
            `- Global Automod: **${enabled ? "✅" : "❌"}**`,
            `- Anti-Spam Shield: **${antiSpam ? "✅" : "❌"}**`,
            `- Anti-Raid Shield: **${antiRaid ? "✅" : "❌"}**`,
            `\n📝 **Filters Status**`,
            `- Anti-Link: **${antiLink ? "✅" : "❌"}**`,
            `- Anti-Invite: **${antiInvite ? "✅" : "❌"}**`,
            `- Anti-Role Ping: **${antiRole ? "✅" : "❌"}**`,
            `- Ghost Ping: **${ghostPing ? "✅" : "❌"}**`,
            `- Invisible Chars: **${invChars ? "✅" : "❌"}**`,
            `- NSFW Filter: **${antiNsfw ? "✅" : "❌"}**`
        ].join("\n");

        const embed = info(interaction.user, statusText, "Server Protection Status", "🚨 Automod System")
          .setColor(enabled ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({
          embeds: [embed],
          flags: 64,
        });
      } else if (sub === "enable") {
        await db.updateSettings(guildId, { "automod.enabled": true });
        await interaction.reply({
          embeds: [success(interaction.user, "Global Automod has been **enabled**.", "System Updated", "🚨 Automod System")],
          flags: 64,
        });
      } else if (sub === "disable") {
        await db.updateSettings(guildId, { "automod.enabled": false });
        await interaction.reply({
          embeds: [success(interaction.user, "Global Automod has been **disabled**.", "System Updated", "🚨 Automod System")],
          flags: 64,
        });
      } else if (sub === "infochannel") {
        const channel = interaction.options.getChannel("channel");
        await db.updateSettings(guildId, { "automod.actionChannel": channel.id });
        await interaction.reply({
          embeds: [success(interaction.user, `Automod action channel set to ${channel}.`, "Channel Updated", "🚨 Automod System")],
          flags: 64,
        });
      } else if (sub === "safechannel") {
        const channel = interaction.options.getChannel("channel");
        let safeChannels = settings.automod?.safeChannels || [];

        if (safeChannels.includes(channel.id)) {
          safeChannels = safeChannels.filter(id => id !== channel.id);
          await db.updateSettings(guildId, { "automod.safeChannels": safeChannels });
          await interaction.reply({
            embeds: [success(interaction.user, `${channel} is no longer a safe channel.`, "Safe Channel Removed", "🚨 Automod System")],
            flags: 64,
          });
        } else {
          safeChannels.push(channel.id);
          await db.updateSettings(guildId, { "automod.safeChannels": safeChannels });
          await interaction.reply({
            embeds: [success(interaction.user, `${channel} is now a safe channel.`, "Safe Channel Added", "🚨 Automod System")],
            flags: 64,
          });
        }
      }
    },
  },

  // --- STRIKE (Protection Toggles) ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("strike")
      .setDescription("Manage server protection shields and filters")
      .addSubcommand((sub) =>
        sub
          .setName("ghostping")
          .setDescription("Toggle ghost ping detection")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("raid")
          .setDescription("Toggle the raid shield (Auto-lockdown enabled)")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("invisiblecharacters")
          .setDescription("Toggle invisible characters filtering")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("spam")
          .setDescription("Toggle the spam shield")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("nsfw")
          .setDescription("Toggle the NSFW word filter (EN/FR)")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("antilink")
          .setDescription("Toggle anti-link protection")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("antiinvite")
          .setDescription("Toggle Discord invite link protection")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("antirole")
          .setDescription("Toggle anti-role mention protection")
          .addStringOption((o) =>
            o
              .setName("state")
              .setDescription("Enable or disable")
              .setRequired(true)
              .addChoices(
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("blockrole")
          .setDescription("Manage blocked roles for mentions")
          .addRoleOption((o) => o.setName("role").setDescription("The role to toggle").setRequired(true)),
      )
      .addSubcommand((sub) =>
        sub.setName("stoplockdown").setDescription("Manually stop an active server lockdown"),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;

      if (sub === "stoplockdown") {
        await db.updateSettings(guildId, { "antiRaid.active": false });
        const everyone = interaction.guild.roles.everyone;
        interaction.guild.channels.cache.forEach(async (channel) => {
            if (channel.isTextBased()) {
                await channel.permissionOverwrites.edit(everyone, { SendMessages: null }, { reason: "Lockdown manually stopped" }).catch(() => {});
            }
        });
        const embed = success(interaction.user, `The server lockdown has been **stopped**. All channels are now open.`, "Lockdown Stopped", "🚨 Automod System")
            .setColor(Colors.SUCCESS);
        return await interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (sub === "blockrole") {
        const role = interaction.options.getRole("role");
        const settings = await db.getSettings(guildId);
        let blockedRoles = settings.automod?.blockedRoles || [];

        if (blockedRoles.includes(role.id)) {
          blockedRoles = blockedRoles.filter(id => id !== role.id);
          await db.updateSettings(guildId, { "automod.blockedRoles": blockedRoles });
          await interaction.reply({
            embeds: [success(interaction.user, `${role} is no longer a blocked role for mentions.`, "Role Unblocked", "🚨 Automod System")],
            flags: 64,
          });
        } else {
          blockedRoles.push(role.id);
          await db.updateSettings(guildId, { "automod.blockedRoles": blockedRoles });
          await interaction.reply({
            embeds: [success(interaction.user, `${role} is now a blocked role for mentions.`, "Role Blocked", "🚨 Automod System")],
            flags: 64,
          });
        }
        return;
      }

      const stateStr = interaction.options.getString("state");
      const state = stateStr === "enable";

      if (sub === "ghostping") {
        await db.updateSettings(guildId, { "automod.categories.ghostPing.enabled": state });
        const embed = success(interaction.user, `**Ghost ping** detection has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "raid") {
        await db.updateSettings(guildId, {
            "antiRaid.enabled": state,
            "antiRaid.lockdown": state
        });
        const embed = success(interaction.user, `The **raid** shield has been **${state ? "enabled" : "disabled"}**. (Lockdown is ${state ? "active" : "inactive"})`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "invisiblecharacters") {
        await db.updateSettings(guildId, { "automod.categories.invisibleChars.enabled": state });
        const embed = success(interaction.user, `**Invisible characters** filtering has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "spam") {
        await db.updateSettings(guildId, { "antiSpam.enabled": state });
        const embed = success(interaction.user, `The **spam** shield has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "nsfw") {
        await db.updateSettings(guildId, { "antiNsfw.enabled": state });
        const embed = success(interaction.user, `The **NSFW** word filter has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "antilink") {
        await db.updateSettings(guildId, { "antiLinks.enabled": state });
        const embed = success(interaction.user, `**Anti-link** protection has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "antiinvite") {
        await db.updateSettings(guildId, { "antiInvites.enabled": state });
        const embed = success(interaction.user, `**Anti-invite** protection has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      } else if (sub === "antirole") {
        await db.updateSettings(guildId, { "antiRoles.enabled": state });
        const embed = success(interaction.user, `**Anti-role** mention protection has been **${state ? "enabled" : "disabled"}**.`, "Shield Updated", "🚨 Automod System")
          .setColor(state ? Colors.SUCCESS : Colors.ERROR);
        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    },
  },

  // --- KEYWORDS ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("keywords")
      .setDescription("Blacklisted words")
      .addSubcommand((sub) =>
        sub
          .setName("add")
          .setDescription("Add a word to the blacklist")
          .addStringOption((o) =>
            o
              .setName("word")
              .setDescription("The word to add")
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) => sub.setName("list").setDescription("List words"))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;
      const settings = await db.getSettings(guildId);
      
      if (sub === "add") {
        const word = interaction.options.getString("word").toLowerCase();
        let keywords = settings.antiKeywords?.keywords || [];
        if (!keywords.includes(word)) {
          keywords.push(word);
          await db.updateSettings(guildId, { 
            "antiKeywords.enabled": true,
            "antiKeywords.keywords": keywords 
          });
        }
        const embed = success(interaction.user, `Added \`${word}\` to the server blacklist.`, "Keyword Added", "🚨 Automod System");
        await interaction.reply({
          embeds: [embed],
          flags: 64,
        });
      } else if (sub === "list") {
        const keywords = settings.antiKeywords?.keywords || [];
        const list = keywords.length > 0
          ? keywords.map(w => `\`${w}\``).join(", ")
          : "No words are currently blacklisted.";
          
        const embed = info(interaction.user, list, "Blacklisted Keywords", "🚨 Automod System");
        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    },
  },
];
