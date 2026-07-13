const db = require('../config/database');

const ShiftModel = {
  async findAll() {
    const [rows] = await db.query(`SELECT ws.*,
      (SELECT COUNT(*) FROM employee_shift_mapping WHERE shift_id=ws.id) AS staff_count
      FROM work_shifts ws ORDER BY ws.name`);
    return rows;
  },

  async create(data) {
    const [r] = await db.query('INSERT INTO work_shifts (name,country,working_days,start_time,end_time,working_hours,is_default,created_by) VALUES (?,?,?,?,?,?,?,?)',
      [data.name, data.country, data.working_days, data.start_time, data.end_time, data.working_hours, data.is_default || false, data.created_by || 'Admin']);
    return r.insertId;
  },

  async update(id, data) {
    await db.query('UPDATE work_shifts SET name=?,country=?,working_days=?,start_time=?,end_time=?,working_hours=?,is_default=? WHERE id=?',
      [data.name, data.country, data.working_days, data.start_time, data.end_time, data.working_hours, data.is_default, id]);
  },

  async remove(id) {
    await db.query('DELETE FROM work_shifts WHERE id=?', [id]);
  },

  async assign(empEmail, shiftId) {
    await db.query('INSERT INTO employee_shift_mapping (emp_email,shift_id) VALUES (?,?) ON DUPLICATE KEY UPDATE shift_id=?', [empEmail, shiftId, shiftId]);
  },
};

module.exports = ShiftModel;
