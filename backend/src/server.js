require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');
const db = require('./config/database');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// ── Static files (screenshots) ───────────────────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/account',      require('./routes/auth.routes'));
app.use('/api/dashboard',    require('./routes/dashboard.routes'));
app.use('/api/admin',        require('./routes/admin.routes'));
app.use('/api/applog',       require('./routes/applog.routes'));
app.use('/api/browserhistory', require('./routes/browser.routes'));
app.use('/api/idle',         require('./routes/idle.routes'));
app.use('/api/screenshot',   require('./routes/screenshot.routes'));
app.use('/api/machine',      require('./routes/machine.routes'));
app.use('/api/settings',     require('./routes/settings.routes'));
app.use('/api/reports',      require('./routes/reports.routes'));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.path}: ${err.message}`);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

// ── Start server ──────────────────────────────────────────────
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`DESK-WATCH-EMS API → http://localhost:${PORT}`);
  try { await db.query('SELECT 1'); logger.info('✓ MySQL connected'); }
  catch (e) { logger.error('✗ MySQL: ' + e.message); }
});
