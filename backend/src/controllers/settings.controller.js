const db = require('../config/database');
const ShiftModel = require('../models/Shift.model');
const AppsMasterModel = require('../models/AppsMaster.model');
const TimeSettingsModel = require('../models/TimeSettings.model');
const { ok, fail } = require('../utils/response');

// Shifts
const getShifts       = async (req, res, next) => { try { return ok(res, await ShiftModel.findAll()); } catch (e) { next(e); } };
const createShift     = async (req, res, next) => { try { const id = await ShiftModel.create(req.body); return ok(res, { id }, 'Created'); } catch (e) { next(e); } };
const updateShift     = async (req, res, next) => { try { await ShiftModel.update(req.params.id, req.body); return ok(res, null, 'Updated'); } catch (e) { next(e); } };
const deleteShift     = async (req, res, next) => { try { await ShiftModel.remove(req.params.id); return ok(res, null, 'Deleted'); } catch (e) { next(e); } };
const assignShift     = async (req, res, next) => { try { await ShiftModel.assign(req.body.empEmail, req.body.shiftId); return ok(res, null, 'Assigned'); } catch (e) { next(e); } };

// Apps Master
const getApps         = async (req, res, next) => { try { return ok(res, await AppsMasterModel.findAll(req.query)); } catch (e) { next(e); } };
const updateAppCat    = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!['productive','neutral','distractive'].includes(category)) return fail(res, 'Invalid category', 400);
    await AppsMasterModel.updateCategory(req.params.id, category);
    return ok(res, null, 'Updated');
  } catch (e) { next(e); }
};
const addApp          = async (req, res, next) => { try { await AppsMasterModel.add(req.body.name, req.body.type, req.body.category); return ok(res, null, 'Added'); } catch (e) { next(e); } };

// Time Settings
const getTimeSettings = async (req, res, next) => { try { return ok(res, await TimeSettingsModel.get(req.query.email)); } catch (e) { next(e); } };

const updateTimeSettings = async (req, res, next) => {
  try {
    const { department, title } = req.query;
    if (department || title) {
      let q = 'SELECT emp_email FROM employees WHERE is_active=1'; const p = [];
      if (department) { q += ' AND department=?'; p.push(department); }
      if (title)      { q += ' AND title=?';      p.push(title); }
      const [rows] = await db.query(q, p);
      for (const r of rows) await TimeSettingsModel.upsert(r.emp_email, req.body);
      return ok(res, null, `Updated ${rows.length} employees`);
    }
    const email = req.body.empEmail || req.body.emp_email;
    if (!email) return fail(res, 'empEmail required', 400);
    await TimeSettingsModel.upsert(email, req.body);
    return ok(res, null, 'Updated');
  } catch (e) { next(e); }
};

const toggleService = async (req, res, next) => {
  try {
    const { empEmail, service, value } = req.body;
    const allowed = ['is_screenshot_enabled','is_app_log_enabled','is_browser_log_enabled','is_idle_enabled','is_geolocation_enabled','is_tracking_enabled'];
    if (!allowed.includes(service)) return fail(res, 'Invalid service', 400);
    if (!empEmail) return fail(res, 'empEmail required', 400);
    await TimeSettingsModel.toggle(empEmail, service, value ? 1 : 0);
    return ok(res, null, 'Updated');
  } catch (e) { next(e); }
};

module.exports = { getShifts, createShift, updateShift, deleteShift, assignShift, getApps, updateAppCat, addApp, getTimeSettings, updateTimeSettings, toggleService };
