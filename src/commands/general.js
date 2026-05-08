const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const os = require("os");
const db = require("../db.js");
const { createBaseEmbed, Emojis, Colors } = require("../utils/embeds.js");

module.exports = [
  // --- INFO (User, Server, Bot, Status) ---
  {
    data: new SlashCommandBuilder()
      .setName("info")
      .setDescription("General information")
      .addSubcommand((sub) =>
        sub
          .setName("user")
          .setDescription("User info")
          .addUserOption((o) =>
            o
              .setName("user")
              .setDescription("The user to get info about")
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub.setName("server").setDescription("Server info"),
      )
      .addSubcommand((sub) => sub.setName("bot").setDescription("Bot info")),
    async execute(interaction) {
      await interaction.deferReply({ flags: interaction.options.getSubcommand() === "user" ? 64 : 0 });
      const sub = interaction.options.getSubcommand();
      const user = interaction.user;

      if (sub === "user") {
        const targetUser = interaction.options.getUser("user");
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const embed = createBaseEmbed(user, { module: "ℹ️ General Info",
          title: `${Emojis.USER} User Info: ${targetUser.tag}`,
          thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 512 }),
          color: Colors.INFO,
        })
        .addFields(
          { name: "🆔 ID", value: `\`${targetUser.id}\``, inline: true },
          { name: "📅 Joined Discord", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
        );
        
        if (member) {
          const roles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r.toString());
          
          embed.addFields(
            { name: "📥 Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: "🏷️ Roles", value: roles.length > 0 ? (roles.length > 10 ? `${roles.slice(0, 10).join(", ")} and ${roles.length - 10} more...` : roles.join(", ")) : "None", inline: false }
          );
        }
        await interaction.editReply({ embeds: [embed] });
      } else if (sub === "server") {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();
        
        const embed = createBaseEmbed(user, { module: "ℹ️ General Info",
          title: `${Emojis.SERVER} Server Info: ${guild.name}`,
          thumbnail: guild.iconURL({ dynamic: true, size: 512 }),
          color: Colors.SUCCESS,
        })
        .addFields(
          { name: "🆔 ID", value: `\`${guild.id}\``, inline: true },
          { name: "👑 Owner", value: `${owner.user.tag} (${owner.id})`, inline: true },
          { name: "📅 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "👥 Members", value: `${Emojis.BULLET} Total: **${guild.memberCount}**\n${Emojis.BULLET} Humans: **${guild.members.cache.filter(m => !m.user.bot).size || "N/A"}**\n${Emojis.BULLET} Bots: **${guild.members.cache.filter(m => m.user.bot).size || "N/A"}**`, inline: true },
          { name: "💬 Channels", value: `${Emojis.BULLET} Total: **${guild.channels.cache.size}**\n${Emojis.BULLET} Text: **${guild.channels.cache.filter(c => c.type === 0).size}**\n${Emojis.BULLET} Voice: **${guild.channels.cache.filter(c => c.type === 2).size}**`, inline: true },
          { name: "✨ Features", value: `${Emojis.BULLET} Boosts: **${guild.premiumSubscriptionCount}** (Level ${guild.premiumTier})\n${Emojis.BULLET} Roles: **${guild.roles.cache.size}**\n${Emojis.BULLET} Emojis: **${guild.emojis.cache.size}**`, inline: true }
        );
        await interaction.editReply({ embeds: [embed] });
      } else if (sub === "bot") {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        
        const embed = createBaseEmbed(user, { module: "ℹ️ General Info",
          title: `${Emojis.BOT} Bot Status & Info`,
          thumbnail: interaction.client.user.displayAvatarURL(),
          color: Colors.INFO,
        })
        .addFields(
          { name: "💻 Platform", value: `\`${os.platform()} (${os.release()})\``, inline: true },
          { name: "🧠 Arch", value: `\`${os.arch()}\``, inline: true },
          { name: "📊 Memory", value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``, inline: true },
          { name: "⚡ Ping", value: `\`${interaction.client.ws.ping}ms\``, inline: true },
          { name: "🕒 Uptime", value: `\`${days}d ${hours}h ${minutes}m\``, inline: true },
          { name: "📚 Node.js", value: `\`${process.version}\``, inline: true },
          { name: "🌐 Servers", value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
          { name: "👥 Users", value: `\`${interaction.client.users.cache.size}\``, inline: true },
          { name: "🛠️ Commands", value: `\`${interaction.client.commands?.size || 0}\``, inline: true }
        );
        await interaction.editReply({ embeds: [embed] });
      }
    },
  },

  // --- SOCIAL (Marriage, Interactions) ---
  {
    data: new SlashCommandBuilder()
      .setName("social")
      .setDescription("Social interactions")
      .addSubcommand((sub) =>
        sub
          .setName("marry")
          .setDescription("Marry a user")
          .addUserOption((o) =>
            o
              .setName("user")
              .setDescription("The user to marry")
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("hug")
          .setDescription("Hug a user")
          .addUserOption((o) =>
            o
              .setName("user")
              .setDescription("The user to hug")
              .setRequired(true),
          ),
      ),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const target = interaction.options.getUser("user");
      const embed = createBaseEmbed(interaction.user, { module: "ℹ️ General Info", color: Colors.FUN });

      if (sub === "hug") {
        embed.setDescription(`${Emojis.HUG} **${interaction.user}** hugs **${target}**!`);
      } else if (sub === "marry") {
        embed.setDescription(`${Emojis.MARRY} **${interaction.user}** proposed to **${target}**!`);
      }
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- PING ---
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Check the bot's latency"),
    async execute(interaction) {
      const sent = await interaction.reply({
        content: "Pinging...",
        fetchReply: true,
      });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const embed = createBaseEmbed(interaction.user, { module: "ℹ️ General Info",
        title: "🏓 Pong!",
        color: Colors.SUCCESS,
      }).addFields(
        {
          name: "🤖 Bot Latency",
          value: `\`${latency}ms\``,
          inline: true,
        },
        {
          name: "🌐 API Latency",
          value: `\`${Math.round(interaction.client.ws.ping)}ms\``,
          inline: true,
        },
      );
      await interaction.editReply({ content: null, embeds: [embed] });
    },
  },

  // --- ABOUT ---
  {
    data: new SlashCommandBuilder()
      .setName("about")
      .setDescription("About DSU-V4"),
    async execute(interaction) {
      const embed = createBaseEmbed(interaction.user, { module: "ℹ️ General Info",
        title: `📖 About DSU-V4`,
        description: "DSU-V4 is a powerful, multi-purpose Discord bot designed to manage and enhance your server with advanced moderation, economy, and utility features.",
        color: Colors.INFO,
      })
      .addFields(
        { name: "👤 Developer", value: "[Thm](https://github.com/CafeTiqueMTK)", inline: true },
        { name: "🔖 Version", value: "4.0.0", inline: true },
        { name: "📚 Library", value: "Discord.js v14", inline: true },
        { name: "🚀 Features", value: `${Emojis.BULLET} Advanced Moderation\n${Emojis.BULLET} Dynamic Economy\n${Emojis.BULLET} Ticket System\n${Emojis.BULLET} GitHub Tracking`, inline: false }
      );
      await interaction.reply({ embeds: [embed] });
    },
  },
];
