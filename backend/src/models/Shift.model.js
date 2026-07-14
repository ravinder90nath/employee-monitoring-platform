const db = require('../config/database');

const ShiftModel = {
  async findAll() {
    const [rows] = await db.query(`SELECT ws.*,
      (SELECT COUNT(*) FROM employee_shift_mapping WHERE shift_id=ws.id) AS staff_count
      FROM work_shifts ws ORDER BY ws.name`);
    return rows;
  },

  async create(data) {
    const [r] = await db.query('INSERT INTO work_shifts (name,country,working_days,start_time,end_time,working_hours,is_default,created_by,day_times) VALUES (?,?,?,?,?,?,?,?,?)',
      [data.name, data.country, data.working_days, data.start_time, data.end_time, data.working_hours, data.is_default || false, data.created_by || 'Admin', data.day_times || null]);
    return r.insertId;
  },

  async update(id, data) {
    await db.query('UPDATE work_shifts SET name=?,country=?,working_days=?,start_time=?,end_time=?,working_hours=?,is_default=?,day_times=? WHERE id=?',
      [data.name, data.country, data.working_days, data.start_time, data.end_time, data.working_hours, data.is_default, data.day_times || null, id]);
  },

  async remove(id) {
    const [rows] = await db.query('SELECT is_default FROM work_shifts WHERE id=?', [id]);
    if (!rows.length) throw new Error('Shift not found');
    if (rows[0].is_default) throw new Error('Default shift cannot be deleted');
    await db.query('DELETE FROM employee_shift_mapping WHERE shift_id=?', [id]);
    await db.query('DELETE FROM work_shifts WHERE id=?', [id]);
  },

  async assign(empEmail, shiftId) {
    await db.query('DELETE FROM employee_shift_mapping WHERE emp_email = ?', [empEmail]);
    await db.query('INSERT INTO employee_shift_mapping (emp_email,shift_id) VALUES (?,?)', [empEmail, shiftId]);
  },

  async unassign(empEmail, shiftId) {
    await db.query('DELETE FROM employee_shift_mapping WHERE emp_email = ? AND shift_id = ?', [empEmail, shiftId]);
  },

  async findAssigned(shiftId) {
    const [rows] = await db.query(`
      SELECT e.emp_email, e.emp_name, e.photo
      FROM employee_shift_mapping esm
      JOIN employees e ON e.emp_email = esm.emp_email
      WHERE esm.shift_id = ? AND e.is_active = 1
      ORDER BY e.emp_name
    `, [shiftId]);
    return rows;
  },
};

module.exports = ShiftModel;
