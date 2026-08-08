const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  isPrivate: { type: Boolean, default: false },
  passcode: { type: String, default: null },
  owner: { type: String, required: true },
  members: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', groupSchema);
