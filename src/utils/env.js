// utils/env.js
const path = require("path");

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
      `Critical missing environment variables: ${missing.join(", ")}`,
    );
    return false;
  }
  return true;
}

const config = {
  production:
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.VERCEL ||
    process.env.NODE_ENV === "production",
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerId: process.env.OWNER_ID,
  mongoUri: process.env.MONGODB_URI,
  webPort: process.env.WEB_PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || "dsu-v4-secret",
  dashboardUser: process.env.DASHBOARD_USER,
  dashboardPassword: process.env.DASHBOARD_PASSWORD,
  githubOwner: process.env.GITHUB_OWNER || "CafeTiqueMTK",
  githubRepo: process.env.GITHUB_REPO || "DSU-V4",
  dataPath:
    process.env.DATA_PATH ||
    (process.env.RAILWAY_ENVIRONMENT
      ? "/data"
      : path.join(process.cwd(), "data")),
  deployCommands: process.env.DEPLOY_COMMANDS !== "false",
  githubToken: process.env.GITHUB_TOKEN,
  geminiKey: process.env.GEMINI_API_KEY,
};

module.exports = { validateEnv, config };
