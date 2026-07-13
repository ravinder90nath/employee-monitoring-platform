const db = require('../config/database');

const SessionModel = {
  async startOrUpdate(email, machineName, ipAddress) {
    const now = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    const [active] = await db.query('SELECT id FROM machine_sessions WHERE emp_email=? AND is_active=1 LIMIT 1', [email]);
    if (active.length) {
      await db.query('UPDATE machine_sessions SET ip_address=?, machine_name=?, session_start=? WHERE id=?', [ipAddress, machineName, now, active[0].id]);
      return active[0].id;
    }
    const [r] = await db.query('INSERT INTO machine_sessions (emp_email,machine_name,ip_address,session_start) VALUES (?,?,?,?)', [email, machineName, ipAddress, now]);
    return r.insertId;
  },

  async close(email) {
    const now = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    await db.query('UPDATE machine_sessions SET is_active=0, session_end=? WHERE emp_email=? AND is_active=1', [now, email]);
  },

  async getRange(email, from, to) {
    const [rows] = await db.query('SELECT * FROM machine_sessions WHERE emp_email=? AND DATE(session_start) BETWEEN ? AND ? ORDER BY session_start DESC', [email, from, to]);
    return rows;
  },

  async getActiveCounts() {
    const [active] = await db.query("SELECT COUNT(*) AS c FROM machine_sessions WHERE is_active=1 AND session_start > DATE_SUB(NOW(),INTERVAL 5 MINUTE)");
    const [idle]   = await db.query("SELECT COUNT(*) AS c FROM machine_sessions WHERE is_active=1 AND session_start > DATE_SUB(NOW(),INTERVAL 15 MINUTE) AND session_start <= DATE_SUB(NOW(),INTERVAL 5 MINUTE)");
    const [longIdle] = await db.query("SELECT COUNT(DISTINCT emp_email) AS c FROM idle_logs WHERE log_date=CURDATE() AND duration_minutes>120");
    return { active: active[0].c, idle: idle[0].c, longIdle: longIdle[0].c };
  },
};

module.exports = SessionModel;
