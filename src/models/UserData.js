const { Schema, model } = require("mongoose");

const warnSchema = new Schema(
  {
    guildId: { type: String },
    moderatorId: { type: String },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

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

    warns: {
      type: [warnSchema],
      validate: [
        {
          validator: (arr) => arr.length <= 500,
          message: "Warns array exceeds the maximum limit of 500 entries.",
        },
      ],
    },
  },
  { timestamps: true, strict: true },
);

userDataSchema.pre("save", function (next) {
  if (this.warns && this.warns.length > 500) {
    this.warns = this.warns.slice(-500);
  }
  next();
});

userDataSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update?.$push?.warns && update.$push.warns.$slice !== -200) {
    update.$push.warns.$slice = -200;
  }
  next();
});

module.exports = model("UserData", userDataSchema);
