const db = require('../config/database');

const AppsMasterModel = {
  async findAll(filters = {}) {
    let q = 'SELECT * FROM apps_master WHERE 1=1';
    const p = [];
    if (filters.category) { q += ' AND category=?'; p.push(filters.category); }
    if (filters.type)     { q += ' AND type=?';     p.push(filters.type); }
    q += ' ORDER BY total_minutes DESC';
    const [rows] = await db.query(q, p);
    return rows;
  },

  async updateCategory(id, category) {
    await db.query('UPDATE apps_master SET category=? WHERE id=?', [category, id]);
  },

  async add(name, type, category) {
    await db.query(`INSERT INTO apps_master (name,type,category) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE category=VALUES(category)`, [name, type, category]);
  },
};

module.exports = AppsMasterModel;
