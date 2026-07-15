const BrowserModel = require('../models/Browser.model');
const EmployeeModel = require('../models/Employee.model');
const logger = require('../utils/logger');
const { ok } = require('../utils/response');

const saveBrowserUsages = async (req, res, next) => {
  try {
    const email = req.body.email || req.query.email;
    const machineName = req.body.machineName || req.query.machineName || req.body.machine || req.query.machine || 'Unknown';
    const createdAt = req.body.createdAt || req.body.created_at || req.query.createdAt;
    // Accept multiple keys for usages for compatibility
    const usages = req.body.usage || req.body.usages || req.body.history || req.body.entries || [];

    logger.debug('Browser save request received', { 
      email, 
      machineName, 
      createdAt,
      usageKey: req.body.usage ? 'usage' : req.body.usages ? 'usages' : 'other',
      usageCount: Array.isArray(usages) ? usages.length : 0
    });

    if (!email) {
      logger.error('saveBrowserUsages called without email', { 
        ip: req.ip, 
        keys: Object.keys(req.body),
        sample: Array.isArray(usages) ? usages.slice(0,1) : usages 
      });
      return res.status(400).json({ success: false, message: 'email required' });
    }
    
    // ensure employee exists
    const emp = await EmployeeModel.findByEmail(email);
    if (!emp) {
      await EmployeeModel.upsert({ emp_email: email, emp_name: email.split('@')[0].replace(/[._]/g, ' '), title: '', department: '', work_location: '', time_zone: 'IST' });
      logger.info(`Auto-created employee record for ${email}`);
    }
    
    const arr = Array.isArray(usages) ? usages : [];
    logger.info('Received browser history', { email, machineName, count: arr.length, createdAt, sampleEntry: arr.length > 0 ? arr[0] : null });
    
    if (arr.length === 0) {
      logger.debug('Browser entries empty, responding with "No entries"', { email });
      return ok(res, null, 'No entries');
    }
    
    await BrowserModel.save(email, machineName, createdAt, arr);
    logger.info(`✓ Browser history saved for ${email}: ${arr.length} entries`);
    return ok(res, { saved: arr.length }, 'Saved');
  } catch (e) { 
    logger.error('Browser save error', { error: e.message, stack: e.stack });
    next(e); 
  }
};

const getBrowserHistory = async (req, res, next) => {
  try {
    const { email, from, to } = req.query;
    const f = from || new Date().toISOString().split('T')[0];
    const t = to   || new Date().toISOString().split('T')[0];
    const result = await BrowserModel.getRange(email, f, t);
    logger.debug(`Retrieved ${result?.length || 0} browser entries for ${email} from ${f} to ${t}`);
    return ok(res, result);
  } catch (e) { next(e); }
};

module.exports = { saveBrowserUsages, getBrowserHistory };
