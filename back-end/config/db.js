const mongoose = require('mongoose');
const { ensureDefaultGroup } = require('../services/groupService');

async function connectDatabase() {
  let primaryUri = process.env.MONGODB_URI;
  const dbUser = process.env.MONGO_DB_USER || process.env.MONGO_USER || process.env.MONGODB_USER;
  const dbPass = process.env.MONGO_DB_PASSWORD || process.env.MONGO_PASSWORD || process.env.MONGODB_PASSWORD;
  const dbHost = process.env.MONGO_DB_HOST || process.env.MONGO_HOST || '127.0.0.1:27017';
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

module.exports = { connectDatabase };
