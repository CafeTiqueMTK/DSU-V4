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
  get githubOwner() {
    return process.env.GITHUB_OWNER || "CafeTiqueMTK";
  },
  get githubRepo() {
    return process.env.GITHUB_REPO || "DSU Preview";
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
  get crashMode() {
    return process.env.CRASH_MODE === "true";
  },
  get debug() {
    return process.env.DEBUG === "true";
  },
};

module.exports = { validateEnv, config };
