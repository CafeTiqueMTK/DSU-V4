require("dotenv").config();
const express = require("express");

// Injection of a mock DB BEFORE loading the WebDashboard
const Module = require('module');
const originalRequire = Module.prototype.require;

const mockSettings = {
  prefix: "!",
  language: "fr",
  automod: { enabled: true, actionChannel: "101" },
  antiSpam: { enabled: true },
  antiInvites: { enabled: true },
  antiLinks: { enabled: false },
  antiRaid: { enabled: false },
  antiMassMention: { enabled: true },
  welcome: { enabled: true, channel: "101", message: "Bienvenue {user} sur le serveur !" },
  farewell: { enabled: false, channel: null, message: "Au revoir {user}" },
  autorole: { enabled: true, roleId: "201" },
  tickets: { enabled: true, categoryId: null, roleId: "202" },
  logs: { enabled: true, channel: "102", categories: { moderation: true, messages: true } }
};

Module.prototype.require = function() {
  if (arguments[0] === '../db.js') {
    return {
      getSettings: async () => mockSettings,
      getDefaultSettings: () => ({
        logs: { categories: { moderation: true, messages: true, voice: false, members: true } }
      }),
      updateSettings: async (guildId, updates) => {
        Object.assign(mockSettings, updates);
        return true;
      },
    };
  }
  return originalRequire.apply(this, arguments);
};

// Force dashboard credentials for testing
process.env.DASHBOARD_USER = "admin";
process.env.DASHBOARD_PASSWORD = "password";
process.env.WEB_PORT = "3000";

const WebDashboard = require("./src/web/server.js");

// Helper to mock Discord.js Collection behavior
const createMockCollection = (entries) => {
  const map = new Map(entries);
  return {
    get: (id) => map.get(id),
    filter: (fn) => createMockCollection([...map.entries()].filter(([k, v]) => fn(v))),
    map: (fn) => [...map.values()].map(fn),
    forEach: (fn) => map.forEach(fn),
    find: (fn) => [...map.values()].find(fn),
    size: map.size,
    first: (n) => (n ? [...map.values()].slice(0, n) : [...map.values()][0]),
    [Symbol.iterator]: () => map.entries()[Symbol.iterator](),
  };
};

// Creation of a fake Bot object to bypass Discord.js connection
const mockBot = {
  readyAt: new Date(),
  commands: { size: 42 },
  users: { cache: { size: 1337 } },
  user: {
    tag: "DSU-TestBot#1234",
    displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/0.png"
  },
  guilds: {
    cache: createMockCollection([
      ["dsu1", {
        id: "dsu1",
        name: "Serveur Test 1 (DSU1)",
        icon: null,
        channels: {
          cache: createMockCollection([
            ["101", { id: "101", name: "général", type: 0 }],
            ["102", { id: "102", name: "logs", type: 0 }],
            ["104", { id: "104", name: "TICKETS", type: 4 }]
          ])
        },
        roles: {
          cache: createMockCollection([
            ["200", { id: "200", name: "@everyone" }],
            ["201", { id: "201", name: "Membre" }],
            ["202", { id: "202", name: "Modérateur" }]
          ])
        },
        members: {
          cache: createMockCollection([
            ["301", { id: "301", user: { tag: "User1#0001", displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/1.png" } }],
            ["302", { id: "302", user: { tag: "User2#0002", displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/2.png" } }]
          ]),
          first: (n) => (n ? [
            { id: "301", user: { tag: "User1#0001", displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/1.png" } },
            { id: "302", user: { tag: "User2#0002", displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/2.png" } }
          ].slice(0, n) : { id: "301", user: { tag: "User1#0001", displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/1.png" } })
        }
      }],
      ["dsu2", {
        id: "dsu2",
        name: "Communauté DSU2",
        icon: null,
        channels: {
          cache: createMockCollection([
            ["103", { id: "103", name: "discussions", type: 0 }]
          ])
        },
        roles: {
          cache: createMockCollection([
            ["200", { id: "200", name: "@everyone" }]
          ])
        },
        members: {
          cache: createMockCollection([]),
          first: () => []
        }
      }]
    ])
  }
};

const dashboard = new WebDashboard(mockBot);

console.log("\n==================================================");
console.log("🚀 MODE TEST UI ACTIVÉ 🚀");
console.log("==================================================");
console.log("Aucune connexion à Discord ni à MongoDB n'est requise.");
console.log("Des fausses données (DSU1, DSU2) sont injectées.");
console.log("");
console.log("IDENTIFIANTS DE CONNEXION :");
console.log("Utilisateur : admin");
console.log("Mot de passe : password");
console.log("");
console.log(`🌐 Tableau de bord disponible sur : http://localhost:${process.env.WEB_PORT}`);
console.log("==================================================\n");

dashboard.app.listen(process.env.WEB_PORT, () => {
  // Listener started
});
