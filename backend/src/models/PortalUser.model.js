const db = require('../config/database');
const bcrypt = require('bcrypt');

const PortalUserModel = {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM portal_users WHERE email=? AND is_active=1', [email]);
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await db.query('SELECT id,email,user_name,title,role,last_login,is_active,photo FROM portal_users ORDER BY user_name');
    return rows;
  },

  async upsert(email, role, name) {
    const [ex] = await db.query('SELECT id FROM portal_users WHERE email=?', [email]);
    if (ex.length) {
      await db.query('UPDATE portal_users SET role=?, is_active=1 WHERE email=?', [role, email]);
    } else {
      const hash = await bcrypt.hash('Welcome@123', 10);
      await db.query('INSERT INTO portal_users (email,password_hash,user_name,role) VALUES (?,?,?,?)', [email, hash, name || email, role]);
    }
  },

  async remove(email) {
    await db.query('DELETE FROM portal_users WHERE email=?', [email]);
  },

  async updateLastLogin(id) {
    await db.query('UPDATE portal_users SET last_login=NOW() WHERE id=?', [id]);
  },
};

module.exports = PortalUserModel;
