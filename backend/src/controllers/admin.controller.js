const db = require('../config/database');
const EmployeeModel = require('../models/Employee.model');
const SessionModel = require('../models/Session.model');
const { ok, fail } = require('../utils/response');
const { toMySQL } = require('../utils/dateHelper');

const saveLogs = async (req, res, next) => {
  try {
    const { createdAt, eventType, eventData, empEmail, machineName } = req.body;
    const ts = toMySQL(createdAt) || new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    await db.query('INSERT INTO agent_logs (emp_email,machine_name,event_type,event_data,created_at) VALUES (?,?,?,?,?)',
      [empEmail, machineName, eventType || 'Info', eventData || '', ts]);
    return res.json({ status: 'Success', Success: true });
  } catch (e) { next(e); }
};

const getUserByEmail = async (req, res, next) => {
  try {
    const emp = await EmployeeModel.findByEmail(req.query.Email || req.query.email);
    if (!emp) return fail(res, 'Not found', 404);
    return ok(res, { email: emp.emp_email, name: emp.emp_name, title: emp.title, department: emp.department, workLocation: emp.work_location, timeZone: emp.time_zone, photo: emp.photo });
  } catch (e) { next(e); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await EmployeeModel.softDelete(req.query.Email || req.query.email);
    return ok(res, null, 'Deleted');
  } catch (e) { next(e); }
};

const getSessionList = async (req, res, next) => {
  try {
    const { email, from, to } = req.query;
    return ok(res, await SessionModel.getRange(email, from, to));
  } catch (e) { next(e); }
};

const getAgentLogs = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const [rows] = await db.query('SELECT * FROM agent_logs WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 500', [fromDate, toDate]);
    return ok(res, rows);
  } catch (e) { next(e); }
};

module.exports = { saveLogs, getUserByEmail, deleteEmployee, getSessionList, getAgentLogs };
