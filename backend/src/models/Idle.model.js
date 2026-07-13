const db = require('../config/database');
const { toMySQL, toDate } = require('../utils/dateHelper');

const IdleModel = {
  async save(email, machineName, idleStart, idleEnd, durationMinutes) {
    if ((durationMinutes || 0) < 0.1) return;
    const ts = toMySQL(idleStart);
    const te = toMySQL(idleEnd);
    const logDate = toDate(idleStart) || new Date().toISOString().split('T')[0];
    await db.query('INSERT INTO idle_logs (emp_email,machine_name,idle_start,idle_end,duration_minutes,log_date) VALUES (?,?,?,?,?,?)',
      [email, machineName, ts, te, durationMinutes || 0, logDate]);
  },

  async getRange(email, from, to) {
    const [rows] = await db.query('SELECT * FROM idle_logs WHERE emp_email=? AND log_date BETWEEN ? AND ? ORDER BY idle_start', [email, from, to]);
    return rows;
  },
};

module.exports = IdleModel;
