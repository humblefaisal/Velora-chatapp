const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true, index: true },
  user: { type: String, required: true },
  text: { type: String, default: '' },
  attachment: {
    name: String,
    url: String,
    size: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
