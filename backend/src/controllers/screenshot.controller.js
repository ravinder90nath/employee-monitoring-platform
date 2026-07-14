const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ScreenshotModel = require('../models/Screenshot.model');
const { ok, fail } = require('../utils/response');
const { getIO } = require('../config/socket');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/screenshots',
      (req.query.email || 'unknown').replace('@', '_').replace(/\./g, '_'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`),
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const saveScreenshot = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const email = req.body.email || req.query.email || 'unknown';
    const machineName = req.body.machineName || req.query.machineName || '';
    const capturedAt = req.body.capturedAt || req.query.capturedAt;
    const screenIndex = parseInt(req.body.screenIndex || req.query.screenIndex) || 1;
    const safeEmail = (email || 'unknown').replace('@', '_').replace(/\./g, '_');
    const filePath = `/uploads/screenshots/${safeEmail}/${req.file.filename}`;
    const id = await ScreenshotModel.save(email, machineName, filePath, req.file.size, capturedAt, screenIndex);
    const io = getIO();
    if (io) io.to('dashboard').emit('new_screenshot', { empEmail: email, filePath: `${process.env.BASE_URL || 'http://localhost:5000'}${filePath}`, capturedAt });
    return ok(res, { id, filePath });
  } catch (e) { next(e); }
};

const getScreenshots = async (req, res, next) => {
  try {
    const { email, date } = req.query;
    const d = date || new Date().toISOString().split('T')[0];
    const rows = await ScreenshotModel.getByDate(email, d);
    const base = process.env.BASE_URL || 'http://localhost:5000';
    return ok(res, rows.map(r => ({ ...r, file_path: `${base}${r.file_path}` })));
  } catch (e) { next(e); }
};

module.exports = { upload: upload.single('screenshot'), saveScreenshot, getScreenshots };
