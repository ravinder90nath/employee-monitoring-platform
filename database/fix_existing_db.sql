-- Run this on your existing desk_watch database to fix all issues
USE desk_watch;

-- 1. Add geolocation_logs table if missing
CREATE TABLE IF NOT EXISTS geolocation_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  address VARCHAR(500),
  location_type ENUM('office','remote','unknown') DEFAULT 'unknown',
  logged_at DATETIME NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Auto-assign default shift to employees missing from employee_shift_mapping
INSERT INTO employee_shift_mapping (emp_email, shift_id)
SELECT e.emp_email, (SELECT id FROM work_shifts WHERE is_default=1 LIMIT 1)
FROM employees e
WHERE e.is_active = 1
  AND NOT EXISTS (SELECT 1 FROM employee_shift_mapping esm WHERE esm.emp_email = e.emp_email)
  AND (SELECT id FROM work_shifts WHERE is_default=1 LIMIT 1) IS NOT NULL;

-- 3. Auto-create time_settings for employees missing it
INSERT IGNORE INTO time_settings (emp_email)
SELECT emp_email FROM employees WHERE is_active = 1;

-- 4. Fix ravi8@yourpc.com specifically - set shorter intervals for testing
UPDATE time_settings
SET screenshot_interval_minutes = 1,
    app_log_interval_minutes = 1,
    browser_log_interval_minutes = 5,
    idle_threshold_minutes = 3
WHERE emp_email = 'ravi8@yourpc.com';

-- 5. Update machine_sessions - fix session_start to NOW() so Ravi shows Online
-- (Run this only if Ravi's agent is currently running)
-- UPDATE machine_sessions SET session_start = NOW() WHERE emp_email = 'ravi8@yourpc.com' AND is_active = 1;

-- 6. Populate departments table from employees (fixes dept filter)
INSERT IGNORE INTO departments (name)
SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != '';

-- 7. Verify fixes
SELECT 'Employees without shift:' as check_name, COUNT(*) as count
FROM employees e WHERE is_active=1
  AND NOT EXISTS (SELECT 1 FROM employee_shift_mapping WHERE emp_email=e.emp_email);

SELECT 'Employees without time_settings:' as check_name, COUNT(*) as count
FROM employees e WHERE is_active=1
  AND NOT EXISTS (SELECT 1 FROM time_settings WHERE emp_email=e.emp_email);

SELECT 'Departments populated:' as check_name, COUNT(*) as count FROM departments;
SELECT 'Apps in master:' as check_name, COUNT(*) as count FROM apps_master;
SELECT 'Shifts:' as check_name, COUNT(*) as count FROM work_shifts;

SELECT emp_email, screenshot_interval_minutes, app_log_interval_minutes FROM time_settings;
