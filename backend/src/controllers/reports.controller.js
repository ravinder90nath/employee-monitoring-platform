const db = require('../config/database');
const ProductivityModel = require('../models/Productivity.model');
const AppLogModel = require('../models/AppLog.model');
const IdleModel = require('../models/Idle.model');
const SessionModel = require('../models/Session.model');
const { ok } = require('../utils/response');

const activityLog = async (req, res, next) => {
  try {
    const { startDate, endDate, department, title } = req.query;
    return ok(res, await ProductivityModel.getWorkingHrs(startDate, endDate, department, title));
  } catch (e) { next(e); }
};

const activityLogByUser = async (req, res, next) => {
  try {
    const { startDate, endDate, empEmail } = req.query;
    const sessions = await SessionModel.getRange(empEmail, startDate, endDate);
    const apps     = await AppLogModel.getRange(empEmail, startDate, endDate);
    const idle     = await IdleModel.getRange(empEmail, startDate, endDate);
    return ok(res, { sessions, apps, idle });
  } catch (e) { next(e); }
};

const workingCompliance = async (req, res, next) => {
  try {
    const { date, department, title } = req.query;
    const d = date || new Date().toISOString().split('T')[0];
    let q = `SELECT e.emp_email, e.emp_name, e.photo,
      ms.session_start, ms.session_end,
      ws.start_time AS shift_start, ws.end_time AS shift_end
      FROM employees e
      LEFT JOIN machine_sessions ms ON ms.emp_email=e.emp_email AND DATE(ms.session_start)=? AND ms.is_active=0
      LEFT JOIN employee_shift_mapping esm ON esm.emp_email=e.emp_email
      LEFT JOIN work_shifts ws ON ws.id=esm.shift_id
      WHERE e.is_active=1`;
    const p = [d];
    if (department) { q += ' AND e.department=?'; p.push(department); }
    if (title)      { q += ' AND e.title=?';      p.push(title); }
    const [rows] = await db.query(q, p);
    let lateCount = 0, earlyLeave = 0, compliant = 0;
    const records = rows.map(r => {
      const loginTime  = r.session_start ? new Date(r.session_start).toTimeString().slice(0,5) : null;
      const logoutTime = r.session_end   ? new Date(r.session_end).toTimeString().slice(0,5)   : null;
      const ss = r.shift_start ? r.shift_start.toString().slice(0,5) : '09:30';
      const se = r.shift_end   ? r.shift_end.toString().slice(0,5)   : '18:30';
      const late  = !!(loginTime  && loginTime  > ss);
      const early = !!(logoutTime && logoutTime < se);
      if (late)  lateCount++;
      if (early) earlyLeave++;
      if (!late && !early && loginTime) compliant++;
      return { ...r, loginTime, logoutTime, shiftStart: ss, shiftEnd: se, isLate: late, isEarlyLeave: early };
    });
    return ok(res, { date: d, totalEmployees: rows.length, lateArrivals: lateCount, earlyDepartures: earlyLeave, compliantEmployees: compliant, records });
  } catch (e) { next(e); }
};

const productivityReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department, title } = req.query;
    return ok(res, await ProductivityModel.getProductivity(startDate, endDate, department, title));
  } catch (e) { next(e); }
};

module.exports = { activityLog, activityLogByUser, workingCompliance, productivityReport };
