const { Schema, model } = require('mongoose');

const marriageSchema = new Schema({
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  proposerId: { type: String, required: true },
  guildId: { type: String, required: true },
  marryDate: { type: Date, default: Date.now },
  divorceDate: { type: Date, default: null },
  isDivorced: { type: Boolean, default: false }
}, { timestamps: true });

// Performance Indexes (High Severity Fix)
marriageSchema.index({ user1Id: 1, isDivorced: 1 });
marriageSchema.index({ user2Id: 1, isDivorced: 1 });

module.exports = model('Marriage', marriageSchema);
