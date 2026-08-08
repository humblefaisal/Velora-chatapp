const bcrypt = require('bcryptjs');
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const { getUserGroups } = require('../services/groupService');

function registerGroupHandlers(socket, { onlineUsers, members, io }) {
  // Room Creation (Supports Public & Private with Passcode)
  socket.on('create-group', async ({ name, isPrivate, passcode, description }, reply) => {
    try {
      const username = socket.data.username;
      if (!username) return reply({ ok: false, error: 'Please sign in again.' });

      const title = String(name || '').trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!slug) return reply({ ok: false, error: 'Choose a valid group name.' });

      const isPrivateRoom = isPrivate === true || isPrivate === 'true' || isPrivate === 1 || isPrivate === '1';

      let group = await Group.findOne({ slug });
      if (group) return reply({ ok: false, error: 'A room with that name already exists.' });

      let hashedPasscode = null;
      if (isPrivateRoom && passcode && String(passcode).trim()) {
        hashedPasscode = await bcrypt.hash(String(passcode).trim(), 10);
      }

      group = await Group.create({
        slug,
        name: title,
        description: String(description || '').trim(),
        isPrivate: isPrivateRoom,
        passcode: hashedPasscode,
        owner: username,
        members: [username]
      });

      console.log(`✅ Saved room "${group.name}" (${group.slug}) in MongoDB | Private: ${group.isPrivate} | Owner: ${group.owner}`);

      // Broadcast group list updates to all online users
      for (const [onlineUser, socketId] of onlineUsers.entries()) {
        const uGroups = await getUserGroups(onlineUser);
        io.to(socketId).emit('groups', uGroups);
      }

      reply({
        ok: true,
        group: {
          id: group.slug,
          name: group.name,
          description: group.description,
          isPrivate: group.isPrivate,
          hasPasscode: Boolean(group.passcode),
          owner: group.owner
        }
      });
    } catch (err) {
      console.error('Create group error:', err);
      reply({ ok: false, error: 'Failed to create room.' });
    }
  });

  // Search All Groups (Public & Private)
  socket.on('search-groups', async ({ query }, reply) => {
    try {
      const username = socket.data.username;
      const searchRegex = new RegExp(String(query || '').trim(), 'i');

      const matches = await Group.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }]
      }).limit(20);

      const results = matches.map((g) => ({
        id: g.slug,
        name: g.name,
        description: g.description,
        isPrivate: g.isPrivate,
        hasPasscode: Boolean(g.passcode),
        owner: g.owner,
        isMember: g.owner === username || g.members.includes(username)
      }));

      reply({ ok: true, results });
    } catch (err) {
      console.error('Search groups error:', err);
      reply({ ok: false, error: 'Search failed.' });
    }
  });

  // Invite User to Room
  socket.on('invite-user', async ({ groupId, targetUsername }, reply) => {
    try {
      const username = socket.data.username;
      const target = String(targetUsername || '').trim();
      if (!username) return reply({ ok: false, error: 'Please sign in again.' });
      if (!target) return reply({ ok: false, error: 'Enter a username to invite.' });

      const group = await Group.findOne({ slug: groupId });
      if (!group) return reply({ ok: false, error: 'Room not found.' });

      const isOwnerOrMember = group.owner === username || group.members.includes(username);
      if (!isOwnerOrMember) return reply({ ok: false, error: 'Only room members can send invites.' });

      const targetUser = await User.findOne({ username: target });
      if (!targetUser) return reply({ ok: false, error: `User "@${target}" was not found.` });

      if (!group.members.includes(target)) {
        group.members.push(target);
        await group.save();
      }

      // Notify target user if online
      const targetSocketId = onlineUsers.get(target);
      if (targetSocketId) {
        const targetGroups = await getUserGroups(target);
        io.to(targetSocketId).emit('groups', targetGroups);
      }

      reply({ ok: true, message: `Added @${target} to #${group.name}.` });
    } catch (err) {
      console.error('Invite user error:', err);
      reply({ ok: false, error: 'Failed to send invite.' });
    }
  });

  // Join Room with Passcode Protection
  socket.on('join-group', async ({ groupId, passcode }, reply) => {
    try {
      const username = socket.data.username;
      if (!username) return reply({ ok: false, error: 'Please sign in again.' });

      const group = await Group.findOne({ slug: groupId });
      if (!group) return reply({ ok: false, error: 'Room not found.' });

      const isOwnerOrMember = group.owner === username || group.members.includes(username);

      if (group.isPrivate && !isOwnerOrMember) {
        if (!group.passcode) {
          return reply({ ok: false, error: 'This is an invite-only private room.' });
        }
        if (!passcode) {
          return reply({ ok: false, error: 'Passcode required to enter this private room.', requiresPasscode: true });
        }
        const isPasscodeValid = await bcrypt.compare(String(passcode), group.passcode);
        if (!isPasscodeValid) {
          return reply({ ok: false, error: 'Incorrect room passcode.' });
        }
      }

      if (!group.members.includes(username)) {
        group.members.push(username);
        await group.save();
      }

      const userGroups = await getUserGroups(username);
      socket.emit('groups', userGroups);

      const current = members.get(socket.id);
      if (current) socket.leave(current);
      members.set(socket.id, groupId);
      socket.join(groupId);

      // Fetch persistent messages from MongoDB
      const messages = await Message.find({ groupId: group.slug })
        .sort({ createdAt: 1 })
        .limit(100);

      reply({
        ok: true,
        group: {
          id: group.slug,
          name: group.name,
          description: group.description,
          isPrivate: group.isPrivate,
          owner: group.owner
        },
        userGroups,
        messages
      });
    } catch (err) {
      console.error('Join group error:', err);
      reply({ ok: false, error: 'Failed to join room.' });
    }
  });
}

module.exports = registerGroupHandlers;
