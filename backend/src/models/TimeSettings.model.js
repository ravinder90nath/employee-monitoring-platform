const db = require('../config/database');

const TimeSettingsModel = {
  async get(email) {
    const [rows] = await db.query('SELECT * FROM time_settings WHERE emp_email=?', [email]);
    if (rows.length) return rows[0];
    await db.query('INSERT IGNORE INTO time_settings (emp_email) VALUES (?)', [email]);
    const [newRows] = await db.query('SELECT * FROM time_settings WHERE emp_email=?', [email]);
    return newRows[0] || null;
  },

  async upsert(email, d) {
    const ss  = parseInt(d.screenshot_interval_minutes)  || 5;
    const al  = parseInt(d.app_log_interval_minutes)     || 30;
    const bl  = parseInt(d.browser_log_interval_minutes) || 30;
    const idle= parseInt(d.idle_threshold_minutes)        || 5;
    const isss= d.is_screenshot_enabled  !== undefined ? (d.is_screenshot_enabled  ? 1 : 0) : 1;
    const isal= d.is_app_log_enabled     !== undefined ? (d.is_app_log_enabled     ? 1 : 0) : 1;
    const isbl= d.is_browser_log_enabled !== undefined ? (d.is_browser_log_enabled ? 1 : 0) : 1;
    const isid= d.is_idle_enabled        !== undefined ? (d.is_idle_enabled        ? 1 : 0) : 1;
    const isge= d.is_geolocation_enabled !== undefined ? (d.is_geolocation_enabled ? 1 : 0) : 0;
    const istr= d.is_tracking_enabled   !== undefined ? (d.is_tracking_enabled    ? 1 : 0) : 1;
    await db.query(
      `INSERT INTO time_settings (emp_email,screenshot_interval_minutes,app_log_interval_minutes,
        browser_log_interval_minutes,idle_threshold_minutes,is_screenshot_enabled,is_app_log_enabled,
        is_browser_log_enabled,is_idle_enabled,is_geolocation_enabled,is_tracking_enabled)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         screenshot_interval_minutes=VALUES(screenshot_interval_minutes),
         app_log_interval_minutes=VALUES(app_log_interval_minutes),
         browser_log_interval_minutes=VALUES(browser_log_interval_minutes),
         idle_threshold_minutes=VALUES(idle_threshold_minutes),
         is_screenshot_enabled=VALUES(is_screenshot_enabled),
         is_app_log_enabled=VALUES(is_app_log_enabled),
         is_browser_log_enabled=VALUES(is_browser_log_enabled),
         is_idle_enabled=VALUES(is_idle_enabled),
         is_geolocation_enabled=VALUES(is_geolocation_enabled),
         is_tracking_enabled=VALUES(is_tracking_enabled)`,
      [email, ss, al, bl, idle, isss, isal, isbl, isid, isge, istr]);
  },

  async toggle(email, service, value) {
    const allowed = new Set([
      'is_screenshot_enabled',
      'is_app_log_enabled',
      'is_browser_log_enabled',
      'is_idle_enabled',
      'is_geolocation_enabled',
      'is_tracking_enabled',
    ]);
    if (!allowed.has(service)) {
      throw new Error('Invalid service');
    }
    await db.query(
      `INSERT INTO time_settings (emp_email, ${service}) VALUES (?, ?) ON DUPLICATE KEY UPDATE ${service}=VALUES(${service})`,
      [email, value],
    );
  },
};

module.exports = TimeSettingsModel;
