const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db.js");
const fetch = require("node-fetch");

// --- Helpers for Gemini ---
async function logGeminiInteraction(interaction, question, response, success) {
  try {
    const settings = await db.getSettings(interaction.guild.id);
    const logs = settings?.logs;

    if (!logs?.enabled || !logs?.channel || !logs?.categories?.gemini) return;

    const logChannel = interaction.guild.channels.cache.get(logs.channel);
    if (!logChannel) return;

    const logEmbed = new EmbedBuilder()
      .setTitle("🤖 Gemini AI Interaction")
      .setColor(success ? 0x4285f4 : 0xff5555)
      .addFields(
        {
          name: "User",
          value: `${interaction.user.tag} (${interaction.user.id})`,
          inline: true,
        },
        {
          name: "Channel",
          value: `<#${interaction.channel.id}>`,
          inline: true,
        },
        {
          name: "Status",
          value: success ? "✅ Success" : "❌ Error",
          inline: true,
        },
        {
          name: "Question",
          value:
            question.length > 1024
              ? question.substring(0, 1021) + "..."
              : question,
          inline: false,
        },
        {
          name: "Response",
          value: success
            ? response.length > 1024
              ? response.substring(0, 1021) + "..."
              : response
            : `Error: ${response}`,
          inline: false,
        },
      )
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  } catch (error) {
    console.error("Error logging Gemini interaction:", error);
  }
}

// --- Helpers for GitHub ---
async function getLanguageColor(language) {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/ozh/github-colors/master/colors.json",
    );
    const colors = await response.json();
    return colors[language]
      ? parseInt(colors[language].color.replace("#", "0x"))
      : null;
  } catch (error) {
    return null;
  }
}

async function getGitHubProfile(interaction) {
  const username = interaction.options.getString("username");
  try {
    await interaction.deferReply();
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DSU-Bot/1.0",
    };
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) headers["Authorization"] = `token ${githubToken}`;

    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`User not found: ${username}`);
      if (response.status === 403) throw new Error("GitHub API rate limit exceeded");
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const user = await response.json();
    const embed = new EmbedBuilder()
      .setTitle(`🐙 GitHub Profile: ${user.login}`)
      .setDescription(user.bio || "No bio available")
      .setColor(0x24292e)
      .setThumbnail(user.avatar_url)
      .setURL(user.html_url)
      .addFields(
        { name: "👤 Name", value: user.name || "Not specified", inline: true },
        { name: "📍 Location", value: user.location || "Not specified", inline: true },
        { name: "🏢 Company", value: user.company || "Not specified", inline: true },
        { name: "📧 Email", value: user.email || "Not public", inline: true },
        { name: "🌐 Blog", value: user.blog ? `[${user.blog}](${user.blog})` : "Not specified", inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:R>`, inline: true },
        { name: "📊 Stats", value: `**Repositories:** ${user.public_repos}\n**Gists:** ${user.public_gists}\n**Followers:** ${user.followers}\n**Following:** ${user.following}`, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    if (user.hireable !== null) embed.addFields({ name: "💼 Hireable", value: user.hireable ? "Yes" : "No", inline: true });
    if (user.twitter_username) embed.addFields({ name: "🐦 Twitter", value: `[@${user.twitter_username}](https://twitter.com/${user.twitter_username})`, inline: true });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = new EmbedBuilder()
      .setTitle("❌ GitHub Profile Error")
      .setDescription(error.message)
      .setColor(0xff5555)
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function getGitHubRepo(interaction) {
  const owner = interaction.options.getString("owner");
  const repo = interaction.options.getString("repository");
  try {
    await interaction.deferReply();
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DSU-Bot/1.0",
    };
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) headers["Authorization"] = `token ${githubToken}`;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!response.ok) throw new Error(`Repository not found: ${owner}/${repo}`);

    const repository = await response.json();
    const languageColor = repository.language ? await getLanguageColor(repository.language) : null;

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${repository.name}`)
      .setDescription(repository.description || "No description available")
      .setColor(languageColor || 0x24292e)
      .setThumbnail(repository.owner.avatar_url)
      .setURL(repository.html_url)
      .addFields(
        { name: "👤 Owner", value: `[${repository.owner.login}](${repository.owner.html_url})`, inline: true },
        { name: "🔒 Visibility", value: repository.private ? "Private" : "Public", inline: true },
        { name: "⭐ Stars", value: repository.stargazers_count.toString(), inline: true },
        { name: "🍴 Forks", value: repository.forks_count.toString(), inline: true },
        { name: "👀 Watchers", value: repository.watchers_count.toString(), inline: true },
        { name: "📝 Issues", value: repository.open_issues_count.toString(), inline: true },
        { name: "💻 Language", value: repository.language || "Not specified", inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(new Date(repository.created_at).getTime() / 1000)}:R>`, inline: true },
        { name: "🔄 Updated", value: `<t:${Math.floor(new Date(repository.updated_at).getTime() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    if (repository.license) embed.addFields({ name: "📄 License", value: repository.license.name, inline: true });
    if (repository.homepage) embed.addFields({ name: "🌐 Homepage", value: `[${repository.homepage}](${repository.homepage})`, inline: true });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = new EmbedBuilder()
      .setTitle("❌ GitHub Repository Error")
      .setDescription(error.message)
      .setColor(0xff5555)
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("askgemini")
      .setDescription("Ask a question to Google Gemini AI")
      .addStringOption((option) =>
        option
          .setName("question")
          .setDescription("Your question for Gemini")
          .setRequired(true),
      ),
    async execute(interaction) {
      const question = interaction.options.getString("question");
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return interaction.reply({
          content: "❌ Gemini API Not Configured",
          ephemeral: true,
        });
      }
      await interaction.deferReply();
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": geminiApiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: question }] }],
            }),
          },
        );
        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
        const data = await response.json();
        const answer = data.candidates[0].content.parts[0].text;
        const embed = new EmbedBuilder()
          .setTitle("🤖 Gemini AI Response")
          .setDescription(answer.length > 4000 ? answer.substring(0, 4000) + "..." : answer)
          .addFields({ name: "Question", value: question, inline: false })
          .setColor(0x4285f4)
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        await logGeminiInteraction(interaction, question, answer, true);
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
        await logGeminiInteraction(interaction, question, error.message, false);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("github")
      .setDescription("GitHub related commands")
      .addSubcommand((sub) =>
        sub
          .setName("profile")
          .setDescription("Get GitHub profile information")
          .addStringOption((opt) =>
            opt.setName("username").setDescription("GitHub username").setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("repo")
          .setDescription("Get GitHub repository information")
          .addStringOption((opt) => opt.setName("owner").setRequired(true))
          .addStringOption((opt) => opt.setName("repository").setRequired(true)),
      ),
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "profile") await getGitHubProfile(interaction);
      else if (subcommand === "repo") await getGitHubRepo(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("weather")
      .setDescription("Show the weather for your location")
      .addStringOption((opt) =>
        opt.setName("city").setDescription("City name").setRequired(true),
      ),
    async execute(interaction) {
      const city = interaction.options.getString("city");
      const apiKey = "9a00d84550d54d1fb19121459250607";
      const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&lang=en`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("City not found");
        const data = await response.json();
        const { current, location } = data;
        const embed = new EmbedBuilder()
          .setTitle(`Weather in ${location.name}, ${location.country}`)
          .setDescription(current.condition.text)
          .addFields(
            { name: "🌡️ Temperature", value: `${current.temp_c}°C`, inline: true },
            { name: "💧 Humidity", value: `${current.humidity}%`, inline: true },
            { name: "💨 Wind", value: `${current.wind_kph} km/h`, inline: true },
          )
          .setThumbnail(`https:${current.condition.icon}`)
          .setColor(0x00bfff)
          .setFooter({ text: "Powered by WeatherAPI.com" })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } catch (e) {
        await interaction.reply({ content: "❌ Error fetching weather.", ephemeral: true });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("wiki")
      .setDescription("Search a Wikipedia article")
      .addStringOption((opt) =>
        opt.setName("query").setDescription("The topic").setRequired(true),
      ),
    async execute(interaction) {
      const query = interaction.options.getString("query");
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Not found");
        const data = await response.json();
        const embed = new EmbedBuilder()
          .setTitle(data.title)
          .setURL(data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`)
          .setDescription(data.extract?.slice(0, 2048) || "No description.")
          .setColor(0x3399ff);
        if (data.thumbnail?.source) embed.setThumbnail(data.thumbnail.source);
        await interaction.reply({ embeds: [embed] });
      } catch (e) {
        await interaction.reply({ content: "❌ Wikipedia search error.", ephemeral: true });
      }
    },
  },
];
