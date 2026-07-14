const BrowserModel = require('../models/Browser.model');
const EmployeeModel = require('../models/Employee.model');
const logger = require('../utils/logger');
const { ok } = require('../utils/response');

const saveBrowserUsages = async (req, res, next) => {
  try {
    const email = req.body.email || req.query.email;
    const machineName = req.body.machineName || req.query.machineName || req.body.machine || req.query.machine;
    const createdAt = req.body.createdAt || req.body.created_at || req.query.createdAt;
    // Accept multiple keys for usages for compatibility
    const usages = req.body.usage || req.body.usages || req.body.history || req.body.entries || [];

    if (!email) {
      logger.warn('saveBrowserUsages called without email', { ip: req.ip, bodySample: Array.isArray(usages) ? usages.slice(0,2) : usages });
      return ok(res, null, 'No email provided');
    }
    // ensure employee exists
    const emp = await EmployeeModel.findByEmail(email);
    if (!emp) await EmployeeModel.upsert({ emp_email: email, emp_name: email.split('@')[0].replace(/[._]/g, ' '), title: '', department: '', work_location: '', time_zone: 'IST' });
    const arr = Array.isArray(usages) ? usages : [];
    logger.info('Received browser usages', { email, machineName, count: arr.length });
    if (arr.length === 0) logger.debug('Browser usages payload sample', { sample: usages });
    await BrowserModel.save(email, machineName, createdAt, arr);
    return ok(res, null, 'Saved');
  } catch (e) { next(e); }
};

const getBrowserHistory = async (req, res, next) => {
  try {
    const { email, from, to } = req.query;
    const f = from || new Date().toISOString().split('T')[0];
    const t = to   || new Date().toISOString().split('T')[0];
    return ok(res, await BrowserModel.getRange(email, f, t));
  } catch (e) { next(e); }
};

module.exports = { saveBrowserUsages, getBrowserHistory };
