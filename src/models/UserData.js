const { Schema, model } = require("mongoose");

const userDataSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },

    coins: { type: Number, default: 0 },
    frozen: { type: Boolean, default: false },

    work: {
      lastWork: { type: Date, default: null },
      streak: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    },

    daily: {
      lastClaim: { type: Date, default: null },
      streak: { type: Number, default: 0 },
    },

    warns: [
      {
        guildId: String,
        moderatorId: String,
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = model("UserData", userDataSchema);
