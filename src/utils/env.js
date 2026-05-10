// utils/env.js
const path = require("path");

// Load .env if not in production environment
const isProduction =
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.VERCEL ||
  process.env.NODE_ENV === "production";

if (!isProduction) {
  require("dotenv").config();
}

const requiredEnvVars = [
  "DISCORD_TOKEN",
  "CLIENT_ID",
  "MONGODB_URI",
  "OWNER_ID",
  "WEB_PORT",
  "SESSION_SECRET",
];

function validateEnv() {
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(
      `[ENV] Critical missing environment variables: ${missing.join(", ")}`,
    );
    return false;
  }
  return true;
}

const config = {
  get production() {
    return isProduction;
  },
  get token() {
    return process.env.DISCORD_TOKEN;
  },
  get clientId() {
    return process.env.CLIENT_ID;
  },
  get ownerId() {
    return process.env.OWNER_ID;
  },
  get mongoUri() {
    return process.env.MONGODB_URI;
  },
  get webPort() {
    return parseInt(process.env.WEB_PORT, 10) || 3000;
  },
  get sessionSecret() {
    return process.env.SESSION_SECRET || "dsu-v4-secret";
  },
  get dashboardUser() {
    return process.env.DASHBOARD_USER;
  },
  get dashboardPassword() {
    return process.env.DASHBOARD_PASSWORD;
  },
  get githubOwner() {
    return process.env.GITHUB_OWNER || "CafeTiqueMTK";
  },
  get githubRepo() {
    return process.env.GITHUB_REPO || "DSU-V4";
  },
  get dataPath() {
    return (
      process.env.DATA_PATH ||
      (process.env.RAILWAY_ENVIRONMENT
        ? "/data"
        : path.join(process.cwd(), "data"))
    );
  },
  get deployCommands() {
    return process.env.DEPLOY_COMMANDS !== "false";
  },
  get githubToken() {
    return process.env.GITHUB_TOKEN;
  },
  get whatsappPhone() {
    return process.env.WHATSAPP_PHONE;
  },
  get whatsappApiKey() {
    return process.env.WHATSAPP_API_KEY;
  },
};

module.exports = { validateEnv, config };
