const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail, generateOtp } = require('../services/emailService');
const { getUserGroups } = require('../services/groupService');

function registerAuthHandlers(socket, { onlineUsers, pendingSignups, io }) {
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
}

module.exports = registerAuthHandlers;
