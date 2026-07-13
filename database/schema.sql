CREATE DATABASE IF NOT EXISTS desk_watch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE desk_watch;

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL UNIQUE,
  emp_name VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  department VARCHAR(100),
  work_location VARCHAR(100),
  time_zone VARCHAR(100) DEFAULT 'IST',
  photo VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE work_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  working_days VARCHAR(100) DEFAULT 'Mon-Fri',
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  working_hours DECIMAL(4,2) DEFAULT 9.00,
  is_default BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(255),
  staff_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employee_shift_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  shift_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES work_shifts(id)
);

CREATE TABLE portal_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  role ENUM('SuperAdmin','Admin','Staff') NOT NULL DEFAULT 'Staff',
  title VARCHAR(100),
  department VARCHAR(100),
  photo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE machine_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  ip_address VARCHAR(50),
  session_start DATETIME NOT NULL,
  session_end DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emp (emp_email, session_start),
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE idle_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  idle_start DATETIME NOT NULL,
  idle_end DATETIME,
  duration_minutes DECIMAL(10,2) DEFAULT 0,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emp (emp_email, log_date),
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE app_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  app_name VARCHAR(500) NOT NULL,
  duration_minutes DECIMAL(10,2) DEFAULT 0,
  log_date DATE NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_emp (emp_email, log_date),
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE browser_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  url VARCHAR(2000),
  domain VARCHAR(255),
  duration_minutes DECIMAL(10,2) DEFAULT 0,
  browser VARCHAR(100),
  log_date DATE NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_emp (emp_email, log_date),
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE screenshots (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  screen_index INT DEFAULT 1,
  captured_at DATETIME NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emp (emp_email, log_date),
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE network_usage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  total_upload_bytes BIGINT DEFAULT 0,
  total_download_bytes BIGINT DEFAULT 0,
  log_date DATE NOT NULL,
  last_updated_at DATETIME,
  UNIQUE KEY uq_emp_date (emp_email, log_date),
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE lock_unlock_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  event_type ENUM('lock','unlock') NOT NULL,
  event_time DATETIME NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE geolocation_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL,
  machine_name VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  address VARCHAR(500),
  location_type ENUM('office','remote','unknown') DEFAULT 'unknown',
  logged_at DATETIME NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE apps_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type ENUM('App','Url') NOT NULL DEFAULT 'App',
  category ENUM('productive','distractive','neutral') NOT NULL DEFAULT 'neutral',
  total_minutes DECIMAL(10,2) DEFAULT 0,
  last_seen DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE time_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255) NOT NULL UNIQUE,
  screenshot_interval_minutes INT DEFAULT 5,
  app_log_interval_minutes INT DEFAULT 30,
  browser_log_interval_minutes INT DEFAULT 30,
  idle_threshold_minutes INT DEFAULT 5,
  is_screenshot_enabled BOOLEAN DEFAULT TRUE,
  is_app_log_enabled BOOLEAN DEFAULT TRUE,
  is_browser_log_enabled BOOLEAN DEFAULT TRUE,
  is_idle_enabled BOOLEAN DEFAULT TRUE,
  is_geolocation_enabled BOOLEAN DEFAULT FALSE,
  is_tracking_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_email) REFERENCES employees(emp_email) ON DELETE CASCADE
);

CREATE TABLE agent_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_email VARCHAR(255),
  machine_name VARCHAR(255),
  event_type ENUM('Error','Success','Fatal','Info','SessionEnd') NOT NULL,
  event_data TEXT,
  created_at DATETIME NOT NULL
);

-- SEED DATA
INSERT INTO work_shifts (name,country,working_days,start_time,end_time,working_hours,is_default,created_by) VALUES
  ('India Shift Default','India','Mon-Sat','09:30:00','18:30:00',9.00,TRUE,'System'),
  ('US EST Shift','USA','Mon-Fri','09:00:00','18:00:00',9.00,FALSE,'System'),
  ('UK Shift','UK','Mon-Fri','09:00:00','17:30:00',8.50,FALSE,'System');

-- password: Admin@1234
INSERT INTO portal_users (email,password_hash,user_name,role,department,title)
VALUES ('admin@ems.com','$2b$10$OOPVCBrGkii0O2v3t4xhP.n/SH17/NEXeK8dYoe3rUSH70Q5TpScC','EMS Admin','SuperAdmin','Operations','TL');

INSERT INTO employees (emp_email,emp_name,title,department,work_location,time_zone) VALUES
  ('john.doe@company.com','John Doe','TL','Engineering','India','IST'),
  ('jane.smith@company.com','Jane Smith','TM','Engineering','India','IST'),
  ('mike.johnson@company.com','Mike Johnson','FM','Operations','India','IST'),
  ('sarah.wilson@company.com','Sarah Wilson','PM','Operations','USA','EST'),
  ('raj.kumar@company.com','Raj Kumar','SSE','Engineering','India','IST'),
  ('priya.sharma@company.com','Priya Sharma','Executive','Marketing','India','IST');

INSERT INTO employee_shift_mapping (emp_email,shift_id) VALUES
  ('john.doe@company.com',1),('jane.smith@company.com',1),
  ('mike.johnson@company.com',1),('raj.kumar@company.com',1),
  ('priya.sharma@company.com',1),('sarah.wilson@company.com',2);

INSERT INTO time_settings (emp_email) VALUES
  ('john.doe@company.com'),('jane.smith@company.com'),
  ('mike.johnson@company.com'),('sarah.wilson@company.com'),
  ('raj.kumar@company.com'),('priya.sharma@company.com');

INSERT INTO apps_master (name,type,category) VALUES
  ('Visual Studio Code','App','productive'),('Microsoft Excel','App','productive'),
  ('Postman','App','productive'),('Figma','App','productive'),
  ('Google Chrome','App','neutral'),('Slack','App','neutral'),
  ('Microsoft Teams','App','neutral'),('Zoom','App','neutral'),
  ('YouTube','Url','distractive'),('Facebook','Url','distractive'),
  ('Instagram','Url','distractive'),('Reddit','Url','distractive'),
  ('Spotify','App','distractive'),('Discord','App','distractive'),
  ('github.com','Url','productive'),('stackoverflow.com','Url','productive');
