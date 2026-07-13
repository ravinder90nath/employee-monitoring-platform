const db = require('../config/database');

const ProductivityModel = {
  async getTopFive(startDate, endDate, department, title) {
    let q = `SELECT am.name, am.type, am.category,
      COALESCE(SUM(al.duration_minutes),0) AS totalMinutes
      FROM apps_master am
      LEFT JOIN app_logs al ON al.app_name=am.name AND al.log_date BETWEEN ? AND ?`;
    const p = [startDate, endDate];
    if (department || title) {
      q += ' LEFT JOIN employees e ON e.emp_email=al.emp_email WHERE 1=1';
      if (department) { q += ' AND e.department=?'; p.push(department); }
      if (title)      { q += ' AND e.title=?';      p.push(title); }
    } else { q += ' WHERE 1=1'; }
    q += ' GROUP BY am.name, am.type, am.category ORDER BY totalMinutes DESC LIMIT 30';
    const [rows] = await db.query(q, p);
    return {
      topProductive:  rows.filter(r => r.category === 'productive').slice(0, 5).map(r => ({ name: r.name, totalMinutes: parseFloat(r.totalMinutes) || 0, type: r.type })),
      topDistracting: rows.filter(r => r.category === 'distractive').slice(0, 5).map(r => ({ name: r.name, totalMinutes: parseFloat(r.totalMinutes) || 0, type: r.type })),
    };
  },

  async getWorkingHrs(startDate, endDate, department, title, page, size) {
    let q = `SELECT e.emp_email, e.emp_name,
      SUM(CASE WHEN ms.session_end IS NOT NULL THEN TIMESTAMPDIFF(MINUTE,ms.session_start,ms.session_end)/60.0 ELSE 0 END) AS workedHours,
      COALESCE(SUM(il.duration_minutes)/60.0, 0) AS idleHours,
      ws.working_hours AS requiredHours
      FROM employees e
      LEFT JOIN machine_sessions ms ON ms.emp_email=e.emp_email AND DATE(ms.session_start) BETWEEN ? AND ?
      LEFT JOIN idle_logs il ON il.emp_email=e.emp_email AND il.log_date BETWEEN ? AND ?
      LEFT JOIN employee_shift_mapping esm ON esm.emp_email=e.emp_email
      LEFT JOIN work_shifts ws ON ws.id=esm.shift_id
      WHERE e.is_active=1`;
    const p = [startDate, endDate, startDate, endDate];
    if (department) { q += ' AND e.department=?'; p.push(department); }
    if (title)      { q += ' AND e.title=?';      p.push(title); }
    q += ' GROUP BY e.emp_email, e.emp_name, ws.working_hours';
    if (page && size) q += ` LIMIT ${size} OFFSET ${(page - 1) * size}`;
    const [rows] = await db.query(q, p);
    return rows.map(r => {
      const worked   = parseFloat(r.workedHours)  || 0;
      const idle     = parseFloat(r.idleHours)    || 0;
      const required = parseFloat(r.requiredHours) || 9;
      const net      = Math.max(0, worked - idle);
      const pct      = required > 0 ? Math.round((net / required) * 100) : 0;
      return { empEmail: r.emp_email, empName: r.emp_name, totalExpectedHours: required,
        totalWorkedHours: Math.round(worked * 100) / 100, totalIdleHours: Math.round(idle * 100) / 100,
        netWorkingHours: Math.round(net * 100) / 100, achievedTarget: net >= required, overAchiever: net > required, pct };
    });
  },

  async getProductivity(startDate, endDate, department, title) {
    let q = `SELECT e.emp_email, e.emp_name, e.department, e.title, e.photo,
      COALESCE(SUM(CASE WHEN am.category='productive'  THEN al.duration_minutes ELSE 0 END),0) AS productive_minutes,
      COALESCE(SUM(CASE WHEN am.category='distractive' THEN al.duration_minutes ELSE 0 END),0) AS distractive_minutes,
      COALESCE(SUM(CASE WHEN am.category='neutral'     THEN al.duration_minutes ELSE 0 END),0) AS neutral_minutes,
      COALESCE(SUM(il.duration_minutes),0) AS idle_minutes
      FROM employees e
      LEFT JOIN app_logs al ON al.emp_email=e.emp_email AND al.log_date BETWEEN ? AND ?
      LEFT JOIN apps_master am ON am.name=al.app_name
      LEFT JOIN idle_logs il ON il.emp_email=e.emp_email AND il.log_date BETWEEN ? AND ?
      WHERE e.is_active=1`;
    const p = [startDate, endDate, startDate, endDate];
    if (department) { q += ' AND e.department=?'; p.push(department); }
    if (title)      { q += ' AND e.title=?';      p.push(title); }
    q += ' GROUP BY e.emp_email ORDER BY productive_minutes DESC';
    const [rows] = await db.query(q, p);
    return rows;
  },
};

module.exports = ProductivityModel;
