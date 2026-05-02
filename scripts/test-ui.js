/**
 * Script de test "Réel" pour DSU-V4
 * Utilise les vraies classes WebDashboard et Database (mockée)
 */

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret";
process.env.DASHBOARD_USER = "admin";
process.env.DASHBOARD_PASSWORD = "password";

const db = require("../src/db.js");
const WebDashboard = require("../src/web/server.js");
const { Collection } = require("discord.js");

// --- MOCK DATABASE ---
// On surcharge db.init pour ne pas essayer de se connecter à MongoDB
db.isReady = true;
db.init = async () => {
  console.log("📦 [MockDB] Base de données simulée activée.");
};
db.getSettings = async (guildId) => {
  return db.ensureCachedGuildSettings(guildId);
};
db.updateSettings = async (guildId, data) => {
  db.updateCachedGuildSettings(guildId, data);
  console.log(`💾 [MockDB] Mise à jour pour ${guildId} :`, data);
  return { ok: true };
};

// --- MOCK BOT ---
const mockBot = {
  user: { tag: "DSU-Mock-Bot#0000", id: "123456789" },
  readyAt: new Date(),
  commands: new Collection(),
  guilds: {
    cache: new Collection([
      [
        "111",
        {
          id: "111",
          name: "DSU Community",
          icon: null,
          iconURL: () => null,
          channels: {
            cache: new Collection([
              ["ch1", { id: "ch1", name: "général", type: 0 }],
              ["ch2", { id: "ch2", name: "annonces", type: 0 }],
            ]),
          },
          roles: {
            cache: new Collection([
              ["r1", { id: "r1", name: "Admin" }],
              ["r2", { id: "r2", name: "Modérateur" }],
              ["r0", { id: "r0", name: "@everyone" }],
            ]),
          },
          members: {
            cache: {
              first: () => [
                {
                  id: "m1",
                  user: {
                    tag: "User1#0001",
                    displayAvatarURL: () => "https://via.placeholder.com/32",
                  },
                },
                {
                  id: "m2",
                  user: {
                    tag: "User2#0002",
                    displayAvatarURL: () => "https://via.placeholder.com/32",
                  },
                },
              ],
            },
          },
        },
      ],
      [
        "222",
        {
          id: "222",
          name: "Staff Headquarters",
          icon: null,
          iconURL: () => null,
          channels: {
            cache: new Collection([
              ["ch3", { id: "ch3", name: "staff-chat", type: 0 }],
            ]),
          },
          roles: {
            cache: new Collection([
              ["r3", { id: "r3", name: "Staff" }],
              ["r0", { id: "r0", name: "@everyone" }],
            ]),
          },
          members: {
            cache: {
              first: () => [],
            },
          },
        },
      ],
      [
        "333",
        {
          id: "333",
          name: "Development Lab",
          icon: null,
          iconURL: () => null,
          channels: {
            cache: new Collection([
              ["ch4", { id: "ch4", name: "dev-logs", type: 0 }],
            ]),
          },
          roles: {
            cache: new Collection([
              ["r4", { id: "r4", name: "Developer" }],
              ["r0", { id: "r0", name: "@everyone" }],
            ]),
          },
          members: {
            cache: {
              first: () => [],
            },
          },
        },
      ],
    ]),
  },
  users: {
    cache: { size: 1250 },
    fetch: async (id) => ({
      id,
      tag: `User#${id}`,
      displayAvatarURL: () => "https://via.placeholder.com/32",
    }),
  },
};

// Peupler les commandes pour l'affichage
for (let i = 0; i < 15; i++) mockBot.commands.set(`cmd${i}`, {});

// Lancement du Dashboard avec le faux bot
const dashboard = new WebDashboard(mockBot);
dashboard.start();

console.log("\n✅ [REAL TEST MODE] Prêt !");
console.log("🌐 URL : http://localhost:3000");
console.log("🔑 Accès : admin / password\n");
