const db = require('../config/database');
const EmployeeModel = require('../models/Employee.model');
const SessionModel = require('../models/Session.model');
const NetworkModel = require('../models/Network.model');
const ProductivityModel = require('../models/Productivity.model');
const { ok } = require('../utils/response');

const getData = async (req, res, next) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) AS c FROM employees WHERE is_active=1');
    const counts  = await SessionModel.getActiveCounts();
    return ok(res, {
      totalUserCount: total[0].c,
      activeUserCount: counts.active,
      totalIdleCount: counts.idle,
      longIdleCount: counts.longIdle,
    });
  } catch (e) { next(e); }
};

const getTopFive = async (req, res, next) => {
  try {
    const { startDate, endDate, Department, Title } = req.query;
    return ok(res, await ProductivityModel.getTopFive(startDate, endDate, Department, Title));
  } catch (e) { next(e); }
};

const getNetworkUsages = async (req, res, next) => {
  try {
    const { startDate, endDate, empEmail } = req.query;
    const rows = await NetworkModel.getRange(startDate, endDate, empEmail);
    return ok(res, rows.map(r => ({
      empEmail: r.emp_email, machineName: r.machine_name,
      totalUploadBytes: r.total_upload_bytes,
      totalDownloadBytes: r.total_download_bytes,
      lastUpdatedAt: r.last_updated_at, log_date: r.log_date,
    })));
  } catch (e) { next(e); }
};

const getWorkingHrsData = async (req, res, next) => {
  try {
    const { startDate, endDate, Department, Title, pageNumber = 1, pageSize = 20 } = req.query;
    const data = await ProductivityModel.getWorkingHrs(startDate, endDate, Department, Title, parseInt(pageNumber), parseInt(pageSize));
    return res.json({ viewType: 'daily', startDate, endDate, requiredHoursPerDay: 9, employeeStats: data });
  } catch (e) { next(e); }
};

const getEmployeeList = async (req, res, next) => {
  try { return ok(res, await EmployeeModel.getList()); } catch (e) { next(e); }
};

module.exports = { getData, getTopFive, getNetworkUsages, getWorkingHrsData, getEmployeeList };
