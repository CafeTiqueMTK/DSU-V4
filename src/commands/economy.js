const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../db.js");

module.exports = [
  // --- CLAIM ---
  {
    data: new SlashCommandBuilder().setName("claim").setDescription("Claim your daily coins"),
    async execute(interaction) {
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;
      const settings = await db.getSettings(guildId);
      if (settings.streak?.enabled === false) return interaction.reply({ content: "Economy system disabled.", flags: 64 });
      const userData = await db.getUserData(userId);
      const daily = userData.daily || {};
      const now = Date.now();
      const lastClaim = daily.lastClaim ? new Date(daily.lastClaim).getTime() : 0;
      if (now - lastClaim < 86400000) {
        const next = new Date(lastClaim + 86400000);
        return interaction.reply({ content: `Next claim: <t:${Math.floor(next.getTime() / 1000)}:R>`, flags: 64 });
      }
      const streak = lastClaim && now - lastClaim < 172800000 ? (daily.streak || 0) + 1 : 1;
      const reward = 100 + Math.min(streak - 1, 10) * 10;
      await db.addCoins(userId, reward);
      await db.saveDailyData(userId, { lastClaim: new Date(now), streak });
      await interaction.reply({ content: `Claimed **${reward} coins**. Streak: **${streak}**`, flags: 64 });
    },
  },

  // --- WORK ---
  {
    data: new SlashCommandBuilder().setName("work").setDescription("Work for coins!"),
    async execute(interaction) {
      const userId = interaction.user.id;
      const workData = await db.getWorkData(userId);
      const now = Date.now();
      const timeLeft = 3600000 - (now - (workData.lastWork || 0));
      if (timeLeft > 0) return interaction.reply({ content: `Wait ${Math.ceil(timeLeft / 60000)}m.`, flags: 64 });
      const reward = Math.floor(Math.random() * 100) + 50;
      const balance = await db.addCoins(userId, reward);
      await db.saveWorkData(userId, { lastWork: now, streak: (workData.streak || 0) + 1 });
      await interaction.reply({ content: `Earned **${reward} coins**. Total: **${balance}**` });
    },
  },

  // --- MYCOINS ---
  {
    data: new SlashCommandBuilder().setName("mycoins").setDescription("View your coins"),
    async execute(interaction) {
      const userData = await db.getUserData(interaction.user.id);
      const embed = new EmbedBuilder()
        .setTitle("Your Coins")
        .setDescription(`💰 Balance: **${userData.coins || 0}**\nStatus: ${userData.frozen ? "⛔ Frozen" : "✅ Active"}`)
        .setColor(userData.frozen ? 0xff5555 : 0xffd700);
      await interaction.reply({ embeds: [embed], flags: 64 });
    },
  },

  // --- RANK (Leaderboard) ---
  {
    data: new SlashCommandBuilder().setName("rank").setDescription("Show the leaderboard"),
    async execute(interaction) {
      const top = await db.getTopUsers(10);
      const desc = top.map((u, i) => `#${i + 1} <@${u.userId}> - **${u.coins || 0}**`).join("\n");
      const embed = new EmbedBuilder().setTitle("Leaderboard").setDescription(desc || "No data").setColor(0xffd700);
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- ECOMAN (Admin Management) ---
  {
    data: new SlashCommandBuilder()
      .setName("ecoman")
      .setDescription("Manage economy (Admin)")
      .addSubcommand((sub) =>
        sub
          .setName("addcoins")
          .setDescription("Add coins")
          .addUserOption((opt) => opt.setName("user").setRequired(true))
          .addIntegerOption((opt) => opt.setName("amount").setRequired(true)),
      )
      .addSubcommand((sub) =>
        sub
          .setName("freeze")
          .setDescription("Freeze account")
          .addUserOption((opt) => opt.setName("user").setRequired(true))
          .addBooleanOption((opt) => opt.setName("state").setRequired(true)),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      if (sub === "addcoins") {
        const amount = interaction.options.getInteger("amount");
        const bal = await db.addCoins(user.id, amount);
        await interaction.reply({ content: `Added ${amount} to <@${user.id}>. Total: ${bal}`, flags: 64 });
      } else if (sub === "freeze") {
        const state = interaction.options.getBoolean("state");
        await db.setUserFrozen(user.id, state);
        await interaction.reply({ content: `<@${user.id}> is now ${state ? "frozen" : "unfrozen"}.`, flags: 64 });
      }
    },
  },

  // --- ECONOMY (System Config) ---
  {
    data: new SlashCommandBuilder()
      .setName("economy")
      .setDescription("System settings")
      .addSubcommand((sub) =>
        sub
          .setName("system")
          .setDescription("Enable/Disable")
          .addStringOption((opt) =>
            opt.setName("state").setRequired(true).addChoices({ name: "enable", value: "enable" }, { name: "disable", value: "disable" }),
          ),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const enabled = interaction.options.getString("state") === "enable";
      await db.updateSettings(interaction.guild.id, { "streak.enabled": enabled });
      await interaction.reply({ content: `Economy system ${enabled ? "enabled" : "disabled"}.`, flags: 64 });
    },
  },
];
