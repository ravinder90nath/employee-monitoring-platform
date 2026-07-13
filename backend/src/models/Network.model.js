const db = require('../config/database');

const NetworkModel = {
  async save(email, machineName, uploadBytes, downloadBytes) {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    await db.query(
      `INSERT INTO network_usage (emp_email,machine_name,total_upload_bytes,total_download_bytes,log_date,last_updated_at)
       VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
       total_upload_bytes=VALUES(total_upload_bytes), total_download_bytes=VALUES(total_download_bytes), last_updated_at=VALUES(last_updated_at)`,
      [email, machineName, uploadBytes || 0, downloadBytes || 0, today, now]);
  },

  async getRange(from, to, empEmail) {
    let q = 'SELECT * FROM network_usage WHERE log_date BETWEEN ? AND ?';
    const p = [from, to];
    if (empEmail) { q += ' AND emp_email=?'; p.push(empEmail); }
    const [rows] = await db.query(q, p);
    return rows;
  },
};

module.exports = NetworkModel;
