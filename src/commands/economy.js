const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("../db.js");
const { createBaseEmbed, success, error, info, Emojis, Colors } = require("../utils/embeds.js");

module.exports = [
  // --- CLAIM ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("claim")
      .setDescription("Claim your daily coins"),
    async execute(interaction) {
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;
      const settings = await db.getSettings(guildId);
      
      if (settings.streak?.enabled === false) {
        const embed = error(interaction.user, "The economy system is currently disabled on this server.", "Economy Disabled", "💰 Economy System");
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      const userData = await db.getUserData(userId);
      const daily = userData.daily || {};
      const now = Date.now();
      const lastClaim = daily.lastClaim ? new Date(daily.lastClaim).getTime() : 0;

      if (now - lastClaim < 86400000) {
        const next = new Date(lastClaim + 86400000);
        const embed = createBaseEmbed(interaction.user, { module: "💰 Economy System",
          title: `⏳ Daily Claim`,
          description: `You've already claimed your daily coins today. Next claim: <t:${Math.floor(next.getTime() / 1000)}:R>`,
          color: Colors.WARNING,
        });
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      const streak = lastClaim && now - lastClaim < 172800000 ? (daily.streak || 0) + 1 : 1;
      const reward = 100 + Math.min(streak - 1, 10) * 10;
      await db.addCoins(userId, reward);
      await db.saveDailyData(userId, { lastClaim: new Date(now), streak });

      const embed = success(interaction.user, `You've claimed your daily reward of **${reward} ${Emojis.COIN}**!`, "Daily Rewards", "💰 Economy System")
        .addFields({ name: "🔥 Current Streak", value: `**${streak} days**`, inline: true });
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- WORK ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("work")
      .setDescription("Work for coins!"),
    async execute(interaction) {
      const userId = interaction.user.id;
      const workData = await db.getWorkData(userId);
      const now = Date.now();
      const timeLeft = 3600000 - (now - (workData.lastWork || 0));

      if (timeLeft > 0) {
        const embed = createBaseEmbed(interaction.user, { module: "💰 Economy System",
          title: `⏳ Work Cooldown`,
          description: `You are too tired to work! Please wait **${Math.ceil(timeLeft / 60000)} minutes**.`,
          color: Colors.WARNING,
        });
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      const reward = Math.floor(Math.random() * 100) + 50;
      const balance = await db.addCoins(userId, reward);
      await db.saveWorkData(userId, {
        lastWork: now,
        streak: (workData.streak || 0) + 1,
      });

      const embed = success(interaction.user, `You worked hard and earned **${reward} ${Emojis.COIN}**!`, "Work Done", "💰 Economy System")
        .addFields({ name: "💰 New Balance", value: `**${balance} coins**`, inline: true })
        .setThumbnail("https://i.imgur.com/8Yv6Z0P.png"); // Placeholder for work icon
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- MYCOINS ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("mycoins")
      .setDescription("View your coins"),
    async execute(interaction) {
      const userData = await db.getUserData(interaction.user.id);
      const embed = createBaseEmbed(interaction.user, { module: "💰 Economy System",
        title: `${Emojis.COIN} Your Balance`,
        description: `💰 Balance: **${userData.coins || 0} coins**\nStatus: ${userData.frozen ? "⛔ Frozen" : "✅ Active"}`,
        color: userData.frozen ? Colors.ERROR : Colors.ECONOMY,
      });
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- RANK (Leaderboard) ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("rank")
      .setDescription("Show the leaderboard"),
    async execute(interaction) {
      const top = await db.getTopUsers(10);
      const desc = top
        .map((u, i) => `**#${i + 1}** <@${u.userId}> • **${u.coins || 0} ${Emojis.COIN}**`)
        .join("\n");
      const embed = createBaseEmbed(interaction.user, { module: "💰 Economy System",
        title: `${Emojis.RANK} Wealth Leaderboard`,
        description: desc || "No data recorded yet.",
        color: Colors.ECONOMY,
      });
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- ECOMAN (Admin Management) ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("ecoman")
      .setDescription("Manage economy (Admin)")
      .addSubcommand((sub) =>
        sub
          .setName("addcoins")
          .setDescription("Add coins")
          .addUserOption((opt) =>
            opt
              .setName("user")
              .setDescription("The user to add coins to")
              .setRequired(true),
          )
          .addIntegerOption((opt) =>
            opt
              .setName("amount")
              .setDescription("The amount of coins to add")
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("freeze")
          .setDescription("Freeze account")
          .addUserOption((opt) =>
            opt
              .setName("user")
              .setDescription("The user to freeze")
              .setRequired(true),
          )
          .addBooleanOption((opt) =>
            opt
              .setName("state")
              .setDescription("The freeze state")
              .setRequired(true),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      
      if (sub === "addcoins") {
        const amount = interaction.options.getInteger("amount");
        const bal = await db.addCoins(user.id, amount);
        const embed = success(interaction.user, `Successfully added **${amount} ${Emojis.COIN}** to <@${user.id}>.`, "Coins Added", "💰 Economy System")
          .addFields({ name: "💰 New Balance", value: `**${bal} coins**`, inline: true });
        await interaction.reply({ embeds: [embed] });
      } else if (sub === "freeze") {
        const state = interaction.options.getBoolean("state");
        await db.setUserFrozen(user.id, state);
        const embed = createBaseEmbed(interaction.user, { module: "💰 Economy System",
          title: state ? `⛔ Account Frozen` : `✅ Account Unfrozen`,
          description: `Account of <@${user.id}> has been **${state ? "frozen" : "unfrozen"}**.`,
          color: state ? Colors.ERROR : Colors.SUCCESS,
        });
        await interaction.reply({ embeds: [embed] });
      }
    },
  },

  // --- ECONOMY (System Config) ---
  {
    requiresDb: true,
    data: new SlashCommandBuilder()
      .setName("economy")
      .setDescription("System settings")
      .addSubcommand((sub) =>
        sub
          .setName("system")
          .setDescription("Enable/Disable")
          .addStringOption((opt) =>
            opt
              .setName("state")
              .setDescription("The state of the economy system")
              .setRequired(true)
              .addChoices(
                { name: "enable", value: "enable" },
                { name: "disable", value: "disable" },
              ),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const enabled = interaction.options.getString("state") === "enable";
      await db.updateSettings(interaction.guild.id, {
        "streak.enabled": enabled,
      });
      const embed = info(interaction.user, `The economy system has been **${enabled ? "enabled" : "disabled"}** for this server.`, "Economy Configuration", "💰 Economy System")
        .setColor(enabled ? Colors.SUCCESS : Colors.ERROR);
      await interaction.reply({ embeds: [embed] });
    },
  },
];
