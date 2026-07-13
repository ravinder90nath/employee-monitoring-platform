const db = require('../config/database');

const EmployeeModel = {
  async findAll(filters = {}) {
    let q = `SELECT e.*,
      ws.name AS shift_name,
      ms.machine_name, ms.ip_address,
      CASE
        WHEN ms.is_active=1 AND ms.session_start > DATE_SUB(NOW(),INTERVAL 5 MINUTE) THEN 'online'
        WHEN ms.is_active=1 AND ms.session_start > DATE_SUB(NOW(),INTERVAL 15 MINUTE) THEN 'idle'
        ELSE 'offline'
      END AS status,
      CASE WHEN ms.session_start IS NOT NULL
           THEN CONCAT(TIMESTAMPDIFF(MINUTE, ms.session_start, NOW()), ' min ago')
           ELSE 'Never' END AS last_signal,
      ts.is_screenshot_enabled, ts.is_app_log_enabled,
      ts.is_idle_enabled, ts.is_browser_log_enabled,
      ts.is_geolocation_enabled, ts.is_tracking_enabled
      FROM employees e
      LEFT JOIN employee_shift_mapping esm ON esm.emp_email = e.emp_email
      LEFT JOIN work_shifts ws ON ws.id = esm.shift_id
      LEFT JOIN machine_sessions ms ON ms.id = (
        SELECT id FROM machine_sessions WHERE emp_email = e.emp_email ORDER BY session_start DESC LIMIT 1
      )
      LEFT JOIN time_settings ts ON ts.emp_email = e.emp_email
      WHERE e.is_active = 1`;
    const p = [];
    if (filters.department) { q += ' AND e.department=?'; p.push(filters.department); }
    if (filters.title)      { q += ' AND e.title=?';      p.push(filters.title); }
    if (filters.search)     { q += ' AND (e.emp_name LIKE ? OR e.emp_email LIKE ?)'; p.push(`%${filters.search}%`, `%${filters.search}%`); }
    q += ' ORDER BY e.emp_name';
    const [rows] = await db.query(q, p);
    return rows;
  },

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM employees WHERE emp_email=?', [email]);
    return rows[0] || null;
  },

  async upsert(data) {
    await db.query(
      `INSERT INTO employees (emp_email,emp_name,title,department,work_location,time_zone,photo)
       VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
       emp_name=VALUES(emp_name), title=VALUES(title), department=VALUES(department),
       work_location=VALUES(work_location), photo=VALUES(photo)`,
      [data.emp_email, data.emp_name, data.title, data.department, data.work_location, data.time_zone||'IST', data.photo||null]
    );
    const [ex] = await db.query('SELECT id FROM employee_shift_mapping WHERE emp_email=?', [data.emp_email]);
    if (!ex.length) {
      const [def] = await db.query('SELECT id FROM work_shifts WHERE is_default=1 LIMIT 1');
      if (def.length) await db.query('INSERT IGNORE INTO employee_shift_mapping (emp_email,shift_id) VALUES (?,?)', [data.emp_email, def[0].id]);
    }
    await db.query('INSERT IGNORE INTO time_settings (emp_email) VALUES (?)', [data.emp_email]);
  },

  async softDelete(email) {
    await db.query('UPDATE employees SET is_active=0 WHERE emp_email=?', [email]);
  },

  async getList() {
    const [rows] = await db.query('SELECT emp_email, emp_name, photo FROM employees WHERE is_active=1 ORDER BY emp_name');
    return rows;
  },

  async getDeptAndTitles() {
    const [depts]  = await db.query('SELECT DISTINCT department FROM employees WHERE is_active=1 AND department IS NOT NULL ORDER BY department');
    const [titles] = await db.query('SELECT DISTINCT department, title FROM employees WHERE is_active=1 AND title IS NOT NULL ORDER BY department, title');
    const [emps]   = await db.query('SELECT emp_email, emp_name, photo, department, title FROM employees WHERE is_active=1');
    const result = {};
    depts.forEach(d => {
      result[d.department] = {};
      titles.filter(t => t.department === d.department).forEach(t => {
        result[d.department][t.title] = emps
          .filter(e => e.department === d.department && e.title === t.title)
          .map(e => ({ email: e.emp_email, name: e.emp_name, photo: e.photo }));
      });
    });
    return result;
  },
};

module.exports = EmployeeModel;
