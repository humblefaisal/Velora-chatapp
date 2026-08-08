const Group = require('../models/Group');

async function ensureDefaultGroup() {
  try {
    const general = await Group.findOne({ slug: 'general' });
    if (!general) {
      await Group.create({
        slug: 'general',
        name: 'General',
        description: 'Public community room for everyone',
        isPrivate: false,
        owner: 'system',
        members: []
      });
      console.log('Created default #general group');
    }
  } catch (err) {
    console.error('Error ensuring default group:', err.message);
  }
}

async function getUserGroups(username) {
  try {
    const groups = await Group.find({}).sort({ createdAt: 1 });

    return groups.map((g) => ({
      id: g.slug,
      name: g.name,
      description: g.description,
      isPrivate: g.isPrivate,
      hasPasscode: Boolean(g.passcode),
      owner: g.owner,
      isMember: g.owner === username || g.members.includes(username)
    }));
  } catch (err) {
    console.error('Error fetching user groups:', err.message);
    return [{ id: 'general', name: 'General', isPrivate: false, isMember: true }];
  }
}

module.exports = {
  ensureDefaultGroup,
  getUserGroups
};
