const db = require('../config/database');
const { toMySQL, toDate } = require('../utils/dateHelper');

const AppLogModel = {
  async save(email, machineName, createdAt, apps) {
    const logDate = toDate(createdAt) || new Date().toISOString().split('T')[0];
    const ts = toMySQL(createdAt) || new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    for (const app of apps) {
      if (!app.appName || (app.durationInMinutes || 0) <= 0) continue;
      const [cat] = await db.query("SELECT category FROM apps_master WHERE LOWER(name)=LOWER(?)", [app.appName]);
      const category = cat.length ? cat[0].category : 'neutral';
      await db.query('INSERT INTO app_logs (emp_email,machine_name,app_name,duration_minutes,log_date,created_at) VALUES (?,?,?,?,?,?)',
        [email, machineName, app.appName, app.durationInMinutes, logDate, ts]);
      await db.query(`INSERT INTO apps_master (name,type,category,total_minutes,last_seen) VALUES (?,'App',?,?,NOW())
        ON DUPLICATE KEY UPDATE total_minutes=total_minutes+VALUES(total_minutes), last_seen=NOW()`,
        [app.appName, category, app.durationInMinutes]);
    }
  },

  async getRange(email, from, to) {
    const [rows] = await db.query('SELECT * FROM app_logs WHERE emp_email=? AND log_date BETWEEN ? AND ? ORDER BY created_at', [email, from, to]);
    return rows;
  },

  async getAggregated(email, from, to) {
    const rows = await this.getRange(email, from, to);
    const map = {};
    for (const r of rows) {
      const key = r.app_name;
      if (!map[key]) {
        const [cat] = await db.query("SELECT category FROM apps_master WHERE LOWER(name)=LOWER(?)", [r.app_name]);
        map[key] = { app_name: r.app_name, duration_minutes: 0, category: cat.length ? cat[0].category : 'neutral' };
      }
      map[key].duration_minutes += parseFloat(r.duration_minutes) || 0;
    }
    return Object.values(map).sort((a, b) => b.duration_minutes - a.duration_minutes);
  },
};

module.exports = AppLogModel;
