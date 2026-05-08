const express = require("express");
const session = require("express-session");
const path = require("path");
const { config } = require("../utils/env.js");
const db = require("../db.js");

class WebDashboard {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
    this.port = config.webPort;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(__dirname, "views"));
    this.app.use(express.static(path.join(__dirname, "public")));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "fallback_secret_change_me",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
      }),
    );
  }

  setupRoutes() {
    const isAuthenticated = (req, res, next) => {
      if (req.session.authenticated) {
        return next();
      }
      res.redirect("/login");
    };

    this.app.use((req, res, next) => {
      res.locals.error = req.query.error || null;
      res.locals.success = req.query.success === "1";
      res.locals.tab = req.query.tab || "general";
      res.locals.bot = this.bot;
      next();
    });

    this.app.get("/login", (req, res) => {
      if (req.session.authenticated) return res.redirect("/");
      res.render("login", { error: null });
    });

    this.app.post("/login", (req, res) => {
      const { username, password } = req.body;
      if (!config.dashboardUser || !config.dashboardPassword) {
        return res.render("login", {
          error: "Le dashboard n'est pas configuré (identifiants manquants).",
        });
      }
      if (
        username === config.dashboardUser &&
        password === config.dashboardPassword
      ) {
        req.session.authenticated = true;
        return res.redirect("/");
      }
      res.render("login", { error: "Identifiants invalides" });
    });

    this.app.get("/logout", (req, res) => {
      req.session.destroy();
      res.redirect("/login");
    });

    this.app.get("/", isAuthenticated, (req, res) => {
      res.render("index");
    });

    // --- Guild Management ---

    this.app.get("/guilds", isAuthenticated, (req, res) => {
      res.render("guilds");
    });

    this.app.get("/guilds/:guildId", isAuthenticated, async (req, res) => {
      const guild = this.bot.guilds.cache.get(req.params.guildId);
      if (!guild) return res.redirect("/guilds");

      const settings = await db.getSettings(guild.id);

      // Fetch data for selects
      const channels = guild.channels.cache
        .filter((c) => c.type === 0 || c.type === 4) // GuildText (0) or Category (4)
        .map((c) => ({ id: c.id, name: c.name, type: c.type }));

      const roles = guild.roles.cache
        .filter((r) => r.name !== "@everyone")
        .map((r) => ({ id: r.id, name: r.name }));

      // Fetch some members for moderation (limit for performance)
      // We'll only get the first 50 for now
      const members = guild.members.cache.first(50).map((m) => ({
        id: m.id,
        tag: m.user.tag,
        avatar: m.user.displayAvatarURL({ size: 32 }),
      }));

      res.render("settings", {
        guild,
        settings,
        channels,
        roles,
        members,
      });
    });

    this.app.post(
      "/guilds/:guildId/settings/:section",
      isAuthenticated,
      async (req, res) => {
        const { guildId, section } = req.params;
        const guild = this.bot.guilds.cache.get(guildId);
        if (!guild) return res.redirect("/guilds");

        try {
          let updates = {};
          if (section === "general") {
            updates = {
              "prefix": req.body.prefix || "!",
              "language": req.body.language || "fr",
            };
          } else if (section === "automod") {
            updates = {
              "automod.enabled": req.body.automod_enabled === "on",
              "automod.actionChannel": req.body.automod_channel || null,
              "antiSpam.enabled": req.body.antiSpam === "on",
              "antiInvites.enabled": req.body.antiInvites === "on",
              "antiLinks.enabled": req.body.antiLinks === "on",
              "antiRaid.enabled": req.body.antiRaid === "on",
              "antiMassMention.enabled": req.body.antiMassMention === "on",
            };
          } else if (section === "welcome") {
            updates = {
              "welcome.enabled": req.body.welcome_enabled === "on",
              "welcome.channel": req.body.welcome_channel || null,
              "welcome.message": req.body.welcome_message || "",
              "farewell.enabled": req.body.farewell_enabled === "on",
              "farewell.channel": req.body.farewell_channel || null,
              "farewell.message": req.body.farewell_message || "",
            };
          } else if (section === "roles") {
            updates = {
              "autorole.enabled": req.body.autorole_enabled === "on",
              "autorole.roleId": req.body.autorole_roleId || null,
              "tickets.enabled": req.body.tickets_enabled === "on",
              "tickets.supportRoleId": req.body.tickets_roleId || null,
              "tickets.ticketsCategory": req.body.tickets_categoryId || null,
              "tickets.welcomeMessage": req.body.tickets_welcomeMessage || "Welcome to your ticket! A support member will assist you soon.",
              "tickets.ticketPrefix": req.body.tickets_ticketPrefix || "ticket",
            };
          } else if (section === "logs") {
            const categories = {};
            const defaultCats = db.getDefaultSettings().logs.categories;
            for (const cat of Object.keys(defaultCats)) {
              categories[cat] = req.body[`log_${cat}`] === "on";
            }
            updates = {
              "logs.enabled": req.body.logs_enabled === "on",
              "logs.channel": req.body.logs_channel || null,
              "logs.categories": categories,
            };
          } else if (section === "embeds") {
            const channel = guild.channels.cache.get(req.body.channel);
            if (channel && channel.isTextBased()) {
               const { EmbedBuilder } = require('discord.js');
               const embed = new EmbedBuilder()
                 .setTitle(req.body.title || "Titre")
                 .setDescription(req.body.description || "Description")
                 .setColor(req.body.color || "#6366f1")
                 .setAuthor({ name: this.bot.user.username, iconURL: this.bot.user.displayAvatarURL() });
               await channel.send({ embeds: [embed] });
               return res.redirect(`/guilds/${guild.id}?success=1&tab=${section}`);
            }
          } else if (section === "moderation") {
            // Forward to the actual moderation route logic
            return res.redirect(307, `/guilds/${guild.id}/mod/${req.body.action}`);
          }

          await db.updateSettings(guild.id, updates);
          res.redirect(`/guilds/${guild.id}?success=1&tab=${section}`);
        } catch (err) {
          res.redirect(
            `/guilds/${guild.id}?error=${encodeURIComponent(err.message)}&tab=${section}`,
          );
        }
      },
    );

    this.app.post(
      "/guilds/:guildId/mod/:action",
      isAuthenticated,
      async (req, res) => {
        const { guildId, action } = req.params;
        const { userId, reason, duration } = req.body;
        const guild = this.bot.guilds.cache.get(guildId);
        if (!guild) return res.status(404).send("Guild not found");

        try {
          const user = await this.bot.users.fetch(userId).catch(() => null);
          if (!user)
            return res.redirect(
              `/guilds/${guild.id}?error=User+not+found&tab=moderation`,
            );

          if (action === "ban") {
            await guild.members.ban(user, {
              reason: reason || "Banned via Web Dashboard",
            });
            await db.logModAction(
              guild,
              user.tag,
              "Ban (Web)",
              reason,
              "Dashboard",
            );
          } else if (action === "kick") {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
              await member.kick(reason || "Kicked via Web Dashboard");
              await db.logModAction(
                guild,
                user.tag,
                "Kick (Web)",
                reason,
                "Dashboard",
              );
            }
          } else if (action === "warn") {
            await db.addWarn(
              guildId,
              userId,
              "Dashboard",
              reason || "Warned via Web Dashboard",
            );
            const warns = await db.getWarns(guildId, userId);
            await db.logModAction(
              guild,
              user.tag,
              "Warn (Web)",
              reason,
              "Dashboard",
              [{ name: "Count", value: warns.length.toString(), inline: true }],
            );
          } else if (action === "mute") {
            const member = await guild.members.fetch(userId).catch(() => null);
            const muteRole = guild.roles.cache.find(
              (r) => r.name.toLowerCase() === "mute",
            );
            if (!muteRole) throw new Error("Mute role not found");
            if (member) {
              await member.roles.add(
                muteRole,
                reason || "Muted via Web Dashboard",
              );
              await db.logModAction(
                guild,
                user.tag,
                "Mute (Web)",
                reason,
                "Dashboard",
                [{ name: "Duration", value: `${duration}m`, inline: true }],
              );
            }

            if (duration) {
              setTimeout(
                async () => {
                  const m = await guild.members.fetch(userId).catch(() => null);
                  if (m && m.roles.cache.has(muteRole.id))
                    await m.roles
                      .remove(muteRole, "End of mute")
                      .catch(() => {});
                },
                parseInt(duration) * 60000,
              );
            }
          }

          res.redirect(`/guilds/${guild.id}?success=1&tab=moderation`);
        } catch (err) {
          res.redirect(
            `/guilds/${guild.id}?error=${encodeURIComponent(err.message)}&tab=moderation`,
          );
        }
      },
    );
  }

  start() {
    if (!config.dashboardUser || !config.dashboardPassword) {
      console.warn(
        "Web Dashboard: DASHBOARD_USER or DASHBOARD_PASSWORD not set. Login will be disabled.",
      );
    }
    this.app.listen(this.port, () => {
      console.log(`Web Dashboard running on http://localhost:${this.port}`);
    });
  }
}

module.exports = WebDashboard;
