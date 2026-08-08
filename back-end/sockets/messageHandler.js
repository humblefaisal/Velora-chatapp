const crypto = require('crypto');
const Message = require('../models/Message');

function registerMessageHandlers(socket, { members, io }) {
  // Send Message with Persistence
  socket.on('send-message', async ({ text, attachment }, reply) => {
    try {
      const username = socket.data.username;
      const groupId = members.get(socket.id);
      if (!username || !groupId) return reply?.({ ok: false, error: 'Select a room first.' });

      const body = String(text || '').trim().slice(0, 2000);
      if (!body && !attachment) return reply?.({ ok: false, error: 'Message cannot be empty.' });

      const msgObj = {
        id: crypto.randomUUID(),
        groupId,
        user: username,
        text: body,
        attachment: attachment || null,
        createdAt: new Date()
      };

      await Message.create(msgObj);
      io.to(groupId).emit('message', msgObj);
      reply?.({ ok: true });
    } catch (err) {
      console.error('Send message error:', err);
      reply?.({ ok: false, error: 'Failed to send message.' });
    }
  });
}

module.exports = registerMessageHandlers;
