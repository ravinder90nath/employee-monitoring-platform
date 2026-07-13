const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { fail } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return fail(res, 'No token', 401);
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT * FROM portal_users WHERE id=? AND is_active=1', [decoded.userId]);
    if (!rows.length) return fail(res, 'User not found', 401);
    req.user = rows[0];
    next();
  } catch { return fail(res, 'Invalid token', 401); }
};

const agentAuth = (req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.apiKey;
  if (key !== process.env.API_KEY) return fail(res, 'Invalid API key', 401);
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return fail(res, 'Forbidden', 403);
  next();
};

module.exports = { authenticate, agentAuth, requireRole };
