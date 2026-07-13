const db = require('../config/database');
const { toMySQL, toDate } = require('../utils/dateHelper');

const ScreenshotModel = {
  async save(email, machineName, filePath, fileSize, capturedAt, screenIndex = 1) {
    const ts = toMySQL(capturedAt) || new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    const logDate = toDate(capturedAt) || new Date().toISOString().split('T')[0];
    const [r] = await db.query('INSERT INTO screenshots (emp_email,machine_name,file_path,file_size,screen_index,captured_at,log_date) VALUES (?,?,?,?,?,?,?)',
      [email, machineName, filePath, fileSize || 0, screenIndex, ts, logDate]);
    return r.insertId;
  },

  async getByDate(email, date) {
    const [rows] = await db.query('SELECT * FROM screenshots WHERE emp_email=? AND log_date=? ORDER BY captured_at', [email, date]);
    return rows;
  },
};

module.exports = ScreenshotModel;
