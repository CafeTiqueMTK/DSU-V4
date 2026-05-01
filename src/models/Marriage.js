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

// Ensure unique active marriage per user per guild?
// Or just global? Usually discord bots do it global or per guild.
// Existing code seems to use user IDs as keys in a global object.
// I'll stick to what the user had or improve it.

module.exports = model('Marriage', marriageSchema);
