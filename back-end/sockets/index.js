const registerAuthHandlers = require('./authHandler');
const registerGroupHandlers = require('./groupHandler');
const registerMessageHandlers = require('./messageHandler');

const onlineUsers = new Map();
const members = new Map();
const pendingSignups = new Map();

function initSockets(io) {
  io.on('connection', (socket) => {
    const state = { onlineUsers, members, pendingSignups, io };

    registerAuthHandlers(socket, state);
    registerGroupHandlers(socket, state);
    registerMessageHandlers(socket, state);

    socket.on('disconnect', () => {
      if (socket.data.username && onlineUsers.get(socket.data.username) === socket.id) {
        onlineUsers.delete(socket.data.username);
      }
      io.emit('presence', { users: [...onlineUsers.keys()] });
    });
  });
}

module.exports = initSockets;
