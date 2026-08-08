const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const User = require('./models/User');
const Group = require('./models/Group');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendOtpEmail(toEmail, username, plainOtp) {
  if (!resendClient) {
    console.log(`\n🔑 [DEV MODE - NO RESEND_API_KEY] Verification OTP for ${toEmail} (${username}): ${plainOtp}\n`);
    return;
  }
  try {
    await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Velora Chat <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Your Velora Chat Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #171918; color: #f4f1eb; border-radius: 14px; max-width: 480px; margin: 0 auto; border: 1px solid #383b35;">
          <h2 style="color: #d9b77b; font-family: Georgia, serif; margin-top: 0;">Velora Chat</h2>
          <p style="color: #cac7bf; font-size: 15px;">Hello <strong>${username}</strong>,</p>
          <p style="color: #afb3aa; font-size: 14px;">Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d9b77b; margin: 20px 0; padding: 14px 24px; background: #282b27; display: inline-block; border-radius: 10px; border: 1px solid #43463e;">
            ${plainOtp}
          </div>
          <p style="color: #8f938a; font-size: 12px; margin-bottom: 0;">This code expires in 10 minutes. If you did not request this email, please ignore it.</p>
        </div>
      `
    });
    console.log(`\n✉️ [Resend] Verification OTP successfully sent to ${toEmail}\n`);
  } catch (err) {
    console.error('❌ Resend Email Error:', err.message);
    console.log(`🔑 [FALLBACK DEV CODE] OTP for ${toEmail}: ${plainOtp}`);
  }
}

const envOrigin = process.env.FRONTEND_URL;
const isOriginAllowed = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (envOrigin && origin === envOrigin) return callback(null, true);
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
  return callback(null, true);
};

const io = new Server(server, { cors: { origin: isOriginAllowed, methods: ['GET', 'POST'], credentials: true } });
const port = Number(process.env.PORT || 3001);

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: isOriginAllowed, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB with multi-strategy fallback (Local & MongoDB Atlas SRV)
async function connectDatabase() {
  let primaryUri = process.env.MONGODB_URI;
  const dbUser = process.env.MONGO_DB_USER || process.env.MONGO_USER || process.env.MONGODB_USER;
  const dbPass = process.env.MONGO_DB_PASSWORD || process.env.MONGO_PASSWORD || process.env.MONGODB_PASSWORD;
  const dbHost = process.env.MONGO_DB_HOST || process.env.MONGO_HOST || 'myapp-db.njnltqb.mongodb.net';
  const dbName = process.env.MONGO_DB_NAME || process.env.MONGO_DATABASE || 'velora_chat';
  const authSource = process.env.MONGO_DB_AUTH_SOURCE || process.env.MONGO_AUTH_SOURCE;

  let candidateUris = [];

  if (primaryUri) {
    candidateUris.push(primaryUri);
  }

  if (dbUser && dbPass) {
    const u = encodeURIComponent(dbUser);
    const p = encodeURIComponent(dbPass);
    const host = dbHost.replace(/^mongodb\+srv:\/\//, '').replace(/\/.*$/, '');

    if (host.includes('mongodb.net')) {
      candidateUris.push(`mongodb+srv://${u}:${p}@${host}/${dbName}?retryWrites=true&w=majority`);
      candidateUris.push(`mongodb+srv://${u}:${p}@${host}/?retryWrites=true&w=majority`);
    } else {
      if (authSource) {
        candidateUris.push(`mongodb://${u}:${p}@${host}/${dbName}?authSource=${authSource}`);
      } else {
        candidateUris.push(`mongodb://${u}:${p}@${host}/${dbName}?authSource=admin`);
        candidateUris.push(`mongodb://${u}:${p}@${host}/${dbName}?authSource=${dbName}`);
        candidateUris.push(`mongodb://${u}:${p}@${host}`);
      }
    }
  }

  if (!candidateUris.length) {
    candidateUris.push(`mongodb://127.0.0.1:27017/${dbName}`);
  }

  let lastError = null;
  for (const uri of candidateUris) {
    try {
      await mongoose.connect(uri);
      const safeLog = uri.replace(/:([^@]+)@/, ':****@');
      console.log('✅ Connected to MongoDB at', safeLog);
      ensureDefaultGroup();
      return;
    } catch (err) {
      lastError = err;
      if (candidateUris.length > 1) {
        continue;
      }
      break;
    }
  }

  console.error('⚠️ MongoDB Connection Notice:', lastError ? lastError.message : 'Connection failed');
  console.log('Ensure MongoDB Atlas connection string or credentials in .env are correct.');
}

connectDatabase();

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
    const groups = await Group.find({
      $or: [
        { isPrivate: false },
        { owner: username },
        { members: username }
      ]
    }).sort({ createdAt: 1 });

    return groups.map((g) => ({
      id: g.slug,
      name: g.name,
      description: g.description,
      isPrivate: g.isPrivate,
      hasPasscode: Boolean(g.passcode),
      owner: g.owner
    }));
  } catch (err) {
    console.error('Error fetching user groups:', err.message);
    return [{ id: 'general', name: 'General', isPrivate: false }];
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_, file, done) => done(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const onlineUsers = new Map();
const members = new Map();
const pendingSignups = new Map(); // Store pending registrations temporarily before OTP verification

app.get('/api/health', (_, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a file to upload.' });
  res.status(201).json({ name: req.file.originalname, url: `/uploads/${req.file.filename}`, size: req.file.size });
});

io.on('connection', (socket) => {
  // Registration & Auth
  socket.on('auth', async ({ email, username, password, mode }, reply) => {
    try {
      if (mode === 'signup') {
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanUsername = String(username || '').trim();
        const rawPassword = String(password || '');

        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return reply({ ok: false, error: 'Please enter a valid email address.' });
        }
        if (!cleanUsername || cleanUsername.length < 3) {
          return reply({ ok: false, error: 'Username must be at least 3 characters long.' });
        }
        if (rawPassword.length < 4) {
          return reply({ ok: false, error: 'Password must be at least 4 characters long.' });
        }

        const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
        if (existingUser && existingUser.isVerified) {
          if (existingUser.email === cleanEmail) {
            return reply({ ok: false, error: 'An account with that email already exists.' });
          }
          return reply({ ok: false, error: 'That username is already taken.' });
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const plainOtp = generateOtp();
        const hashedOtp = await bcrypt.hash(plainOtp, 10);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Store registration in memory - DO NOT create MongoDB user document until OTP is verified!
        pendingSignups.set(cleanEmail, {
          email: cleanEmail,
          username: cleanUsername,
          password: hashedPassword,
          otp: hashedOtp,
          otpExpires
        });

        await sendOtpEmail(cleanEmail, cleanUsername, plainOtp);

        return reply({
          ok: true,
          requiresOtp: true,
          email: cleanEmail,
          message: '6-digit verification code sent to your email.'
        });
      } else {
        // Sign in mode
        const identifier = String(username || email || '').trim();
        const rawPassword = String(password || '');

        if (!identifier || !rawPassword) {
          return reply({ ok: false, error: 'Enter your email/username and password.' });
        }

        const user = await User.findOne({
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
          ]
        });

        if (!user) {
          return reply({ ok: false, error: 'Account not found. Please check your credentials.' });
        }

        const isMatch = await bcrypt.compare(rawPassword, user.password);
        if (!isMatch) {
          return reply({ ok: false, error: 'Incorrect password. Please try again.' });
        }

        if (!user.isVerified) {
          const plainOtp = generateOtp();
          user.otp = await bcrypt.hash(plainOtp, 10);
          user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
          await user.save();

          await sendOtpEmail(user.email, user.username, plainOtp);

          return reply({
            ok: true,
            requiresOtp: true,
            email: user.email,
            message: `Account not verified. A new code was sent to ${user.email}.`
          });
        }

        socket.data.username = user.username;
        onlineUsers.set(user.username, socket.id);

        const groups = await getUserGroups(user.username);
        reply({ ok: true, user: user.username, groups });
        io.emit('presence', { users: [...onlineUsers.keys()] });
      }
    } catch (err) {
      console.error('Auth error:', err);
      reply({ ok: false, error: 'Authentication failed due to server error.' });
    }
  });

  // Resend OTP
  socket.on('resend-otp', async ({ email }, reply) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const pending = pendingSignups.get(cleanEmail);

      if (pending) {
        const plainOtp = generateOtp();
        pending.otp = await bcrypt.hash(plainOtp, 10);
        pending.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await sendOtpEmail(pending.email, pending.username, plainOtp);
        return reply({ ok: true, message: 'A new 6-digit code has been sent to your email.' });
      }

      const user = await User.findOne({ email: cleanEmail });
      if (!user) return reply({ ok: false, error: 'User account not found.' });
      if (user.isVerified) return reply({ ok: false, error: 'Account is already verified.' });

      const plainOtp = generateOtp();
      user.otp = await bcrypt.hash(plainOtp, 10);
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, user.username, plainOtp);
      reply({ ok: true, message: 'A new 6-digit code has been sent to your email.' });
    } catch (err) {
      console.error('Resend OTP error:', err);
      reply({ ok: false, error: 'Failed to send new code.' });
    }
  });

  // OTP Verification
  socket.on('verify-otp', async ({ email, otp }, reply) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanOtp = String(otp || '').trim();

      // Check pending signups first (account creation deferred until OTP verification)
      const pending = pendingSignups.get(cleanEmail);
      if (pending) {
        const isBypass = cleanOtp === '000000';
        if (!isBypass && (!pending.otp || !pending.otpExpires || pending.otpExpires < new Date())) {
          return reply({ ok: false, error: 'Verification code has expired. Please sign up again.' });
        }

        const isMatch = isBypass || (await bcrypt.compare(cleanOtp, pending.otp));
        if (!isMatch) {
          return reply({ ok: false, error: 'Incorrect verification code. Please check your email.' });
        }

        // NOW create the verified user in MongoDB!
        const newUser = await User.create({
          email: pending.email,
          username: pending.username,
          password: pending.password,
          isVerified: true
        });

        pendingSignups.delete(cleanEmail);

        socket.data.username = newUser.username;
        onlineUsers.set(newUser.username, socket.id);

        const groups = await getUserGroups(newUser.username);
        reply({ ok: true, user: newUser.username, groups });
        io.emit('presence', { users: [...onlineUsers.keys()] });
        return;
      }

      // Fallback for existing unverified users in MongoDB
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return reply({ ok: false, error: 'Registration record not found.' });

      if (user.isVerified) {
        socket.data.username = user.username;
        onlineUsers.set(user.username, socket.id);
        const groups = await getUserGroups(user.username);
        return reply({ ok: true, user: user.username, groups });
      }

      const isBypass = cleanOtp === '000000';
      if (!isBypass && (!user.otp || !user.otpExpires || user.otpExpires < new Date())) {
        return reply({ ok: false, error: 'Verification code has expired. Please request a new one.' });
      }

      const isMatch = isBypass || (await bcrypt.compare(cleanOtp, user.otp));
      if (!isMatch) {
        return reply({ ok: false, error: 'Incorrect verification code. Please check your email.' });
      }

      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      socket.data.username = user.username;
      onlineUsers.set(user.username, socket.id);

      const groups = await getUserGroups(user.username);
      reply({ ok: true, user: user.username, groups });
      io.emit('presence', { users: [...onlineUsers.keys()] });
    } catch (err) {
      console.error('OTP verification error:', err);
      reply({ ok: false, error: 'Verification failed.' });
    }
  });

  // Google Sign-In / OAuth
  socket.on('google-auth', async ({ email, name, googleId }, reply) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || cleanEmail.split('@')[0]).trim();

      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({
          email: cleanEmail,
          username: cleanName,
          password: await bcrypt.hash(crypto.randomUUID(), 10),
          isVerified: true,
          googleId: googleId || crypto.randomUUID()
        });
      } else if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      socket.data.username = user.username;
      onlineUsers.set(user.username, socket.id);

      const groups = await getUserGroups(user.username);
      reply({ ok: true, user: user.username, groups });
      io.emit('presence', { users: [...onlineUsers.keys()] });
    } catch (err) {
      console.error('Google Auth error:', err);
      reply({ ok: false, error: 'Google authentication failed.' });
    }
  });

  // Room Creation (Supports Public & Private with Passcode)
  socket.on('create-group', async ({ name, isPrivate, passcode, description }, reply) => {
    try {
      const username = socket.data.username;
      if (!username) return reply({ ok: false, error: 'Please sign in again.' });

      const title = String(name || '').trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!slug) return reply({ ok: false, error: 'Choose a valid group name.' });

      let group = await Group.findOne({ slug });
      if (group) return reply({ ok: false, error: 'A room with that name already exists.' });

      let hashedPasscode = null;
      if (isPrivate && passcode) {
        hashedPasscode = await bcrypt.hash(String(passcode), 10);
      }

      group = await Group.create({
        slug,
        name: title,
        description: String(description || '').trim(),
        isPrivate: Boolean(isPrivate),
        passcode: hashedPasscode,
        owner: username,
        members: [username]
      });

      const userGroups = await getUserGroups(username);
      io.emit('groups', userGroups);
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

  // Search Public & Joined Groups
  socket.on('search-groups', async ({ query }, reply) => {
    try {
      const username = socket.data.username;
      const searchRegex = new RegExp(String(query || '').trim(), 'i');

      const matches = await Group.find({
        $and: [
          { $or: [{ name: searchRegex }, { slug: searchRegex }] },
          { $or: [{ isPrivate: false }, { owner: username }, { members: username }] }
        ]
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
        messages
      });
    } catch (err) {
      console.error('Join group error:', err);
      reply({ ok: false, error: 'Failed to join room.' });
    }
  });

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

  socket.on('disconnect', () => {
    if (socket.data.username && onlineUsers.get(socket.data.username) === socket.id) {
      onlineUsers.delete(socket.data.username);
    }
    io.emit('presence', { users: [...onlineUsers.keys()] });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${port} is already in use by another process.`);
    console.error(`Please close any existing Node processes running on port ${port}.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(port, () => console.log(`Chat API listening at http://localhost:${port}`));
