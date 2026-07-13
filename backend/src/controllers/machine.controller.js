const db = require('../config/database');
const EmployeeModel = require('../models/Employee.model');
const SessionModel = require('../models/Session.model');
const NetworkModel = require('../models/Network.model');
const TimeSettingsModel = require('../models/TimeSettings.model');
const { ok } = require('../utils/response');
const { toMySQL, toDate, nowIST } = require('../utils/dateHelper');

const heartbeat = async (req, res, next) => {
  try {
    const { email, machineName, ipAddress } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    const emp = await EmployeeModel.findByEmail(email);
    if (!emp) await EmployeeModel.upsert({ emp_email: email, emp_name: email.split('@')[0].replace(/[._]/g, ' '), title: 'TL', department: 'Engineering', work_location: 'India', time_zone: 'IST' });
    await SessionModel.startOrUpdate(email, machineName || 'Unknown', ipAddress || '0.0.0.0');
    const ts = await TimeSettingsModel.get(email);
    return ok(res, {
      screenshot_interval_minutes: ts?.screenshot_interval_minutes || 5,
      app_log_interval_minutes:    ts?.app_log_interval_minutes    || 30,
      idle_threshold_minutes:      ts?.idle_threshold_minutes      || 5,
      is_screenshot_enabled:       ts?.is_screenshot_enabled !== 0,
      is_app_log_enabled:          ts?.is_app_log_enabled    !== 0,
      is_tracking_enabled:         ts?.is_tracking_enabled   !== 0,
    }, 'OK');
  } catch (e) { next(e); }
};

const lockUnlock = async (req, res, next) => {
  try {
    const { email, machineName, eventType, eventTime } = req.body;
    const ts = toMySQL(eventTime) || nowIST();
    const logDate = toDate(eventTime) || new Date().toISOString().split('T')[0];
    await db.query('INSERT INTO lock_unlock_events (emp_email,machine_name,event_type,event_time,log_date) VALUES (?,?,?,?,?)', [email, machineName, eventType, ts, logDate]);
    return ok(res, null, 'Logged');
  } catch (e) { next(e); }
};

const saveNetwork = async (req, res, next) => {
  try {
    const { email, machineName, uploadBytes, downloadBytes } = req.body;
    await NetworkModel.save(email, machineName, uploadBytes, downloadBytes);
    return ok(res, null, 'Saved');
  } catch (e) { next(e); }
};

const saveGeo = async (req, res, next) => {
  try {
    const { email, machineName, latitude, longitude, address, locationType } = req.body;
    const now = nowIST();
    const today = new Date().toISOString().split('T')[0];
    await db.query('INSERT INTO geolocation_logs (emp_email,machine_name,latitude,longitude,address,location_type,logged_at,log_date) VALUES (?,?,?,?,?,?,?,?)',
      [email, machineName, latitude, longitude, address, locationType || 'unknown', now, today]);
    return ok(res, null, 'Saved');
  } catch (e) { next(e); }
};

module.exports = { heartbeat, lockUnlock, saveNetwork, saveGeo };
