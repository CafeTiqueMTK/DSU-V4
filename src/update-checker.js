const { EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const db = require("./db.js");
const { config: envConfig } = require("./utils/env.js");

class UpdateChecker {
  constructor(client) {
    this.client = client;
    this.checkInterval = 5 * 60 * 1000;
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    console.log("🔄 Update checker started.");
    this.checkForUpdates();
    this.timer = setInterval(() => this.checkForUpdates(), this.checkInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkForUpdates() {
    try {
      const updateConfig = await db.get("updates.json");
      if (!updateConfig || Object.keys(updateConfig).length === 0) return;

      for (const [guildId, config] of Object.entries(updateConfig)) {
        if (!config.enabled || !config.channelId) continue;

        const guild = this.client.guilds.cache.get(guildId);
        const channel = guild?.channels.cache.get(config.channelId);
        if (!channel) continue;

        await this.checkGuildUpdates(guild, channel, config, guildId);
      }
    } catch (error) {
      console.error("❌ Error in UpdateChecker:", error);
    }
  }

  async manualCheck(guildId) {
    const updateConfig = await db.get("updates.json");
    const config = updateConfig[guildId];

    if (!config?.channelId) {
      return { success: false, message: "Update channel is not configured." };
    }

    const guild = this.client.guilds.cache.get(guildId);
    const channel = guild?.channels.cache.get(config.channelId);
    if (!guild || !channel) {
      return {
        success: false,
        message: "Configured guild or channel not found.",
      };
    }

    await this.checkGuildUpdates(guild, channel, config, guildId);
    return { success: true };
  }

  async checkGuildUpdates(guild, channel, config, guildId) {
    const repoOwner = envConfig.githubOwner;
    const repoName = envConfig.githubRepo;

    try {
      const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DSU-Bot",
      };
      if (process.env.GITHUB_TOKEN)
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;

      const res = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=1`,
        { headers },
      );
      if (!res.ok) return;

      const [latest] = await res.json();
      if (!latest) return;

      if (config.lastCommit === latest.sha) return;

      // Update and Notify
      config.lastCommit = latest.sha;
      const updateConfig = await db.get("updates.json");
      updateConfig[guildId] = config;
      db.set("updates.json", updateConfig);

      const embed = new EmbedBuilder()
        .setTitle("🚀 New Update Available!")
        .setDescription(`**${latest.commit.message.split("\n")[0]}**`)
        .setColor(0x00ff99)
        .addFields(
          { name: "👤 Author", value: latest.commit.author.name, inline: true },
          {
            name: "🔗 Commit",
            value: `[\`${latest.sha.substring(0, 7)}\`](${latest.html_url})`,
            inline: true,
          },
        )
        .setTimestamp();

      await channel.send({
        content: config.roleId ? `<@&${config.roleId}>` : undefined,
        embeds: [embed],
      });
    } catch (e) {
      console.error(`❌ Update check failed for ${guild.name}:`, e.message);
    }
  }
}

module.exports = UpdateChecker;
