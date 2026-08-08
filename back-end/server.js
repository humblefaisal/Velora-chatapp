const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDatabase } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const initSockets = require('./sockets');

const app = express();
const server = http.createServer(app);

const envOrigin = process.env.FRONTEND_URL;
const isOriginAllowed = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (envOrigin && origin === envOrigin) return callback(null, true);
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
  return callback(null, true);
};

const io = new Server(server, {
  cors: { origin: isOriginAllowed, methods: ['GET', 'POST'], credentials: true }
});
const port = Number(process.env.PORT || 3001);

const uploadsDir = path.join(__dirname, 'uploads');

app.use(cors({ origin: isOriginAllowed, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Mount REST API routes
app.use('/api', apiRoutes);

// Initialize Socket.IO handlers
initSockets(io);

// Connect Database
connectDatabase();

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
