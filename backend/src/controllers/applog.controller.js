const AppLogModel = require('../models/AppLog.model');
const EmployeeModel = require('../models/Employee.model');
const { ok } = require('../utils/response');

const saveApplog = async (req, res, next) => {
  try {
    const { email, machineName, createdAt, apps } = req.body;
    await AppLogModel.save(email, machineName, createdAt, apps || []);
    const emp = await EmployeeModel.findByEmail(email);
    if (!emp) await EmployeeModel.upsert({ emp_email: email, emp_name: email.split('@')[0], title: '', department: '', work_location: '', time_zone: 'IST' });
    return ok(res, null, 'Saved');
  } catch (e) { next(e); }
};

const getApplog = async (req, res, next) => {
  try {
    const { fromDate, toDate, emailId } = req.query;
    const aggregated = await AppLogModel.getAggregated(emailId, fromDate, toDate);
    const raw = await AppLogModel.getRange(emailId, fromDate, toDate);
    const grouped = {};
    raw.forEach(r => {
      if (!grouped[r.emp_email]) grouped[r.emp_email] = { employeeEmail: r.emp_email, machineName: r.machine_name || '', appdata: [] };
      grouped[r.emp_email].appdata.push({
        appName: r.app_name,
        durationInMinutes: parseFloat(r.duration_minutes) || 0,
        createdAt: r.created_at,
        category: r.category || 'neutral',
        logDate: r.log_date,
      });
    });
    return ok(res, { aggregated, raw: Object.values(grouped) });
  } catch (e) { next(e); }
};

module.exports = { saveApplog, getApplog };
