const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("../db.js");
const fetch = require("node-fetch");
const { getGuildData, saveGuildData } = require("../utils/guildManager");
const { createBaseEmbed, Emojis, Colors } = require("../utils/embeds");

module.exports = [
  // --- CAT ---
  {
    data: new SlashCommandBuilder()
      .setName("cat")
      .setDescription("Sends a cat image 🐱"),
    async execute(interaction) {
      try {
        const res = await fetch("https://api.thecatapi.com/v1/images/search");
        const data = await res.json();
        const embed = createBaseEmbed(interaction.user, {
          title: "🐱 Random Cat",
          image: data[0].url,
          color: Colors.FUN,
        });
        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ content: "Error fetching cat.", flags: 64 });
      }
    },
  },

  // --- DOG ---
  {
    data: new SlashCommandBuilder()
      .setName("dog")
      .setDescription("Sends a dog image 🐶"),
    async execute(interaction) {
      try {
        const res = await fetch("https://dog.ceo/api/breeds/image/random");
        const data = await res.json();
        const embed = createBaseEmbed(interaction.user, {
          title: "🐶 Random Dog",
          image: data.message,
          color: Colors.FUN,
        });
        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ content: "Error fetching dog.", flags: 64 });
      }
    },
  },

  // --- MEME ---
  {
    data: new SlashCommandBuilder()
      .setName("meme")
      .setDescription("Random meme from Reddit"),
    async execute(interaction) {
      await interaction.deferReply();
      try {
        const subs = ["memes", "dankmemes", "funny"];
        const sub = subs[Math.floor(Math.random() * subs.length)];
        const res = await fetch(
          `https://www.reddit.com/r/${sub}/hot.json?limit=50`,
        );
        const data = await res.json();
        const posts = data.data.children.filter(
          (p) =>
            p.data.url &&
            (p.data.url.endsWith(".jpg") || p.data.url.endsWith(".png")),
        );
        const post = posts[Math.floor(Math.random() * posts.length)].data;
        const embed = createBaseEmbed(interaction.user, {
          title: post.title,
          image: post.url,
          color: Colors.FUN,
        }).setFooter({ text: `r/${sub} | u/${post.author} | Requested by ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply("Error fetching meme.");
      }
    },
  },

  // --- RPS (Rock Paper Scissors) ---
  {
    data: new SlashCommandBuilder()
      .setName("rps")
      .setDescription("Play Rock, Paper, Scissors for 100 coins!")
      .addUserOption((opt) =>
        opt
          .setName("opponent")
          .setDescription("The user to play against")
          .setRequired(true),
      ),
    async execute(interaction) {
      const challenger = interaction.user;
      const opponent = interaction.options.getUser("opponent");
      if (challenger.id === opponent.id || opponent.bot)
        return interaction.reply({ content: "Invalid opponent.", flags: 64 });

      const embed = createBaseEmbed(interaction.user, {
        title: "🎮 RPS Challenge!",
        description: `${challenger} challenged ${opponent} to a game of Rock, Paper, Scissors!\n\n**Prize:** 100 ${Emojis.COIN}\n\nClick a button below to accept or decline.`,
        color: Colors.FUN,
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rps_acc_${challenger.id}`)
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success)
          .setEmoji(Emojis.SUCCESS),
        new ButtonBuilder()
          .setCustomId(`rps_dec_${challenger.id}`)
          .setLabel("Decline")
          .setStyle(ButtonStyle.Danger)
          .setEmoji(Emojis.ERROR),
      );

      const msg = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });
      const coll = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === opponent.id,
        time: 60000,
      });

      coll.on("collect", async (i) => {
        if (i.customId.startsWith("rps_dec")) {
          const decEmbed = createBaseEmbed(interaction.user, {
            title: "Challenge Declined",
            description: `${opponent} declined the challenge from ${challenger}.`,
            color: Colors.ERROR,
          });
          await i.update({
            embeds: [decEmbed],
            components: [],
          });
        } else {
          await i.update({
            content: "Game started! Check DMs (Simulated: Tie for now).",
            embeds: [],
            components: [],
          });
        }
      });
    },
  },

  // --- RATE ---
  {
    data: new SlashCommandBuilder()
      .setName("rate")
      .setDescription("Rate someone for fun!")
      .addSubcommand((sub) =>
        sub
          .setName("chad")
          .setDescription("Rate how much of a chad someone is")
          .addUserOption((o) =>
            o
              .setName("user")
              .setDescription("The user to rate")
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("hot")
          .setDescription("Rate how hot someone is")
          .addUserOption((o) =>
            o
              .setName("user")
              .setDescription("The user to rate")
              .setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("smart")
          .setDescription("Rate how smart someone is")
          .addUserOption((o) =>
            o
              .setName("user")
              .setDescription("The user to rate")
              .setRequired(true),
          ),
      ),
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("user");
      const pct = Math.floor(Math.random() * 101);
      
      let emoji = "🤔";
      if (pct > 80) emoji = "🔥";
      else if (pct > 50) emoji = "👍";
      else if (pct > 20) emoji = "👎";
      else emoji = "💀";

      const embed = createBaseEmbed(interaction.user, {
        title: `${sub.charAt(0).toUpperCase() + sub.slice(1)} Rater`,
        description: `**${user.username}** is **${pct}%** ${sub}! ${emoji}`,
        color: Colors.FUN,
      });
      await interaction.reply({ embeds: [embed] });
    },
  },

  // --- FUNNYMSG (Config) ---
  {
    data: new SlashCommandBuilder()
      .setName("funnymsg")
      .setDescription("Configure funny responses (Admin)")
      .addSubcommand((sub) =>
        sub
          .setName("eat")
          .setDescription("Enable or disable the eat response")
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
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const state = interaction.options.getString("state") === "enable";
      const guildId = interaction.guild.id;
      const settings = getGuildData(guildId, "settings");
      if (!settings[guildId]) settings[guildId] = { funny: {} };
      if (!settings[guildId].funny) settings[guildId].funny = {};
      settings[guildId].funny.eat = { enabled: state };
      saveGuildData(guildId, settings, "settings");
      
      const embed = createBaseEmbed(interaction.user, {
        title: "Funny Configuration",
        description: `Eat detection has been **${state ? "enabled" : "disabled"}**.`,
        color: state ? Colors.SUCCESS : Colors.ERROR,
      });
      await interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    },
  },
];
