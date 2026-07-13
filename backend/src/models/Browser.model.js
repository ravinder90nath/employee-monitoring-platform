const db = require('../config/database');
const { toMySQL, toDate } = require('../utils/dateHelper');

const BrowserModel = {
  async save(email, machineName, createdAt, usages) {
    const logDate = toDate(createdAt) || new Date().toISOString().split('T')[0];
    const ts = toMySQL(createdAt) || new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    for (const u of usages) {
      let domain = null;
      try { domain = new URL(u.url?.startsWith('http') ? u.url : 'https://' + u.url).hostname.replace(/^www\./, ''); } catch {}
      await db.query('INSERT INTO browser_history (emp_email,machine_name,url,domain,duration_minutes,browser,log_date,created_at) VALUES (?,?,?,?,?,?,?,?)',
        [email, machineName, u.url, domain, u.durationInMinutes || 0, u.browser || 'Chrome', logDate, ts]);
      if (domain) {
        await db.query(`INSERT INTO apps_master (name,type,total_minutes,last_seen) VALUES (?,'Url',?,NOW())
          ON DUPLICATE KEY UPDATE total_minutes=total_minutes+VALUES(total_minutes), last_seen=NOW()`,
          [domain, u.durationInMinutes || 0]);
      }
    }
  },
};

module.exports = BrowserModel;
