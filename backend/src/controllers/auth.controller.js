const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const EmployeeModel = require('../models/Employee.model');
const PortalUserModel = require('../models/PortalUser.model');
const { ok, fail } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Body received:', req.body);
      return fail(res, 'Email and password required', 400);
    }
    const user = await PortalUserModel.findByEmail(email);
    if (!user) return fail(res, 'Invalid credentials', 401);
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return fail(res, 'Invalid credentials', 401);
    await PortalUserModel.updateLastLogin(user.id);
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '9h' });
    const { password_hash, ...safe } = user;
    return ok(res, { ...safe, accessToken: token, userName: user.user_name, userEmail: user.email });
  } catch (e) { next(e); }
};

const getStaffDetails = async (req, res, next) => {
  try {
    const emps = await EmployeeModel.findAll(req.query);
    return ok(res, emps.map(e => ({
      empEmail: e.emp_email, empName: e.emp_name,
      shiftName: e.shift_name || 'Default Shift',
      computerName: e.machine_name || '', ipAddress: e.ip_address || '',
      lastSignal: e.last_signal || 'Never',
      isTracking: !!e.is_tracking_enabled,
      isScreenShotDisable: !e.is_screenshot_enabled,
      isApplogDisable: !e.is_app_log_enabled,
      isIdleDisable: !e.is_idle_enabled,
      isGeolocationDisable: !e.is_geolocation_enabled,
      photo: e.photo || '', status: e.status || 'offline',
    })));
  } catch (e) { next(e); }
};

const getDepartmentAndTitle = async (req, res, next) => {
  try {
    const data = await EmployeeModel.getDeptAndTitles();
    const departmentTitles = Object.entries(data).map(([dept, titles]) => ({
      department: dept,
      titles: Object.entries(titles).map(([title, employees]) => ({ title, employees })),
    }));
    return ok(res, { departmentTitles });
  } catch (e) { next(e); }
};

const getUserList   = async (req, res, next) => { try { return ok(res, await PortalUserModel.findAll()); } catch (e) { next(e); } };
const getEmployeeList = async (req, res, next) => {
  try {
    const emps = await EmployeeModel.findAll();
    return ok(res, emps.map(e => ({
      emp_email: e.emp_email,
      emp_name: e.emp_name,
      photo: e.photo,
      shift_name: e.shift_name || 'Default Shift',
      shift_id: e.shift_id || null,
      shift_start: e.shift_start || '09:00:00',
      shift_end: e.shift_end || '18:00:00',
      working_hours: e.working_hours || 9.00,
    })));
  } catch (e) { next(e); }
};

const assignRole = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const emp = await EmployeeModel.findByEmail(email);
    await PortalUserModel.upsert(email, role, emp?.emp_name);
    return ok(res, null, 'Role assigned');
  } catch (e) { next(e); }
};

const deleteManagementUser = async (req, res, next) => {
  try { await PortalUserModel.remove(req.body.empEmail); return ok(res, null, 'Removed'); }
  catch (e) { next(e); }
};

module.exports = { login, getStaffDetails, getDepartmentAndTitle, getUserList, getEmployeeList, assignRole, deleteManagementUser };
