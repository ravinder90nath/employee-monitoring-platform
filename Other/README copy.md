# DESK-WATCH-EMS — Employee Monitoring System
**React (Component Architecture) + Node.js (MVC) + MySQL + Python Agent**

---

## Architecture

### Backend — Strict MVC
```
backend/src/
├── server.js                         ← Entry point (Express + Socket.IO)
├── config/
│   ├── database.js                   ← MySQL pool
│   └── socket.js                     ← Socket.IO init
├── middleware/
│   └── auth.js                       ← JWT + API key guards
├── models/                           ← One file per domain
│   ├── Employee.model.js
│   ├── Session.model.js
│   ├── AppLog.model.js
│   ├── Screenshot.model.js
│   ├── Network.model.js
│   ├── Idle.model.js
│   ├── Browser.model.js
│   ├── PortalUser.model.js
│   ├── Shift.model.js
│   ├── AppsMaster.model.js
│   ├── TimeSettings.model.js
│   └── Productivity.model.js
├── controllers/                      ← One file per domain
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   ├── admin.controller.js
│   ├── applog.controller.js
│   ├── browser.controller.js
│   ├── idle.controller.js
│   ├── screenshot.controller.js
│   ├── machine.controller.js
│   ├── settings.controller.js
│   └── reports.controller.js
├── routes/                           ← One file per domain
│   ├── auth.routes.js
│   ├── dashboard.routes.js
│   ├── admin.routes.js
│   ├── applog.routes.js
│   ├── browser.routes.js
│   ├── idle.routes.js
│   ├── screenshot.routes.js
│   ├── machine.routes.js
│   ├── settings.routes.js
│   └── reports.routes.js
└── utils/
    ├── logger.js
    ├── response.js
    └── dateHelper.js
```

### Frontend — Component Architecture
```
frontend/src/
├── App.jsx                           ← Router only
├── index.js                          ← Entry
├── styles/globals.css                ← Global CSS vars + dark theme
├── services/                         ← API calls per domain
│   ├── api.js                        ← Axios instance + authFetch
│   ├── auth.service.js
│   ├── dashboard.service.js
│   ├── staff.service.js
│   ├── screenshot.service.js
│   ├── reports.service.js
│   └── settings.service.js
├── hooks/                            ← Custom React hooks
│   ├── useFetch.js
│   ├── useAuth.js
│   ├── useDeptTitles.js
│   ├── useEmployeeList.js
│   └── useDebounce.js
├── store/
│   └── authStore.js                  ← Zustand auth store
├── utils/
│   └── helpers.js                    ← fmt, today, weekAgo, etc.
├── components/
│   ├── common/index.jsx              ← Button, Card, Avatar, Badge, Modal, Toggle...
│   └── layout/
│       ├── AppLayout.jsx
│       ├── Sidebar.jsx
│       ├── Topbar.jsx
│       └── ProtectedRoute.jsx
└── pages/                            ← Each page = folder with components
    ├── auth/
    │   └── Login.jsx
    ├── dashboard/
    │   ├── office/
    │   │   ├── OfficeDashboard.jsx
    │   │   └── components/
    │   │       ├── StatCards.jsx
    │   │       ├── Top5Chart.jsx
    │   │       ├── NetworkChart.jsx
    │   │       ├── AttendancePanel.jsx
    │   │       └── ProductivityScore.jsx
    │   └── staff/
    │       ├── StaffDashboard.jsx
    │       └── components/
    │           ├── TimelineBar.jsx
    │           ├── WorkStatsRow.jsx
    │           ├── ActivitiesPanel.jsx
    │           ├── ScreenshotsPanel.jsx
    │           └── WeeklyView.jsx
    ├── users/
    │   └── UserManagement.jsx
    ├── reports/
    │   ├── activityLog/ActivityLog.jsx
    │   ├── workingHours/WorkingHoursCompliance.jsx
    │   └── productivity/ProductivityReport.jsx
    └── settings/
        ├── calendar/CalendarSettings.jsx
        ├── manageProductivity/ManageProductivity.jsx
        ├── manageAdmin/ManageAdmin.jsx
        ├── timeSettings/TimeSettings.jsx
        └── manageService/ManageService.jsx
```

---

## Quick Start

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend && npm install
# Edit .env — set DB_HOST, DB_USER, DB_PASS
npm run dev
```

### 3. Frontend
```bash
cd frontend && npm install
npm start
```
**Login:** admin@ems.com / Admin@1234

### 4. Agent (Windows)
```bash
cd agent
pip install -r requirements.txt
python agent.py --configure
python agent.py
```


# Building the Agent Executable (.exe)

Follow these steps to generate a standalone Windows executable for the agent.

## Prerequisites

- Python 3.12 (or the version used for development)
- pip

## Step 1: Navigate to the Agent Directory

```bash
cd agent
```

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 3: Install PyInstaller

```bash
pip install pyinstaller
```

> If PyInstaller is already installed, you can update it using:

```bash
pip install --upgrade pyinstaller
```

## Step 4: Generate the Executable

### Console Version (Recommended for Debugging)

```bash
pyinstaller --onefile agent.py
```

### Background/Silent Version (No Command Prompt)

```bash
pyinstaller --onefile --noconsole agent.py
```

or

```bash
pyinstaller --onefile --windowed agent.py
```

Both commands create an executable that runs without displaying a terminal window.

## Step 5: Locate the Executable

After the build completes successfully, the executable will be available at:

```
agent/
├── build/
├── dist/
│   └── agent.exe
├── agent.spec
```

The executable is located inside the `dist` folder.

## Step 6: Initial Configuration

If running the agent for the first time, configure it by executing:

```bash
agent.exe --configure
```

This creates the required configuration.

After configuration, simply run:

```bash
agent.exe
```

## Clean Previous Builds (Optional)

Before generating a new executable, remove previous build artifacts:

```bash
rmdir /s /q build
rmdir /s /q dist
del agent.spec
```

Then rebuild:

```bash
pyinstaller --onefile --noconsole agent.py
```

## Notes

- Use `--onefile` to package everything into a single executable.
- Use `--noconsole` (or `--windowed`) to run the agent silently without opening a terminal window.
- The generated executable can be found in the `dist` directory.
- If additional files such as `.env`, `config.json`, or other resources are required, ensure they are available alongside the executable or include them using PyInstaller's `--add-data` option.


---

## API Documentation

### Authentication
- **Portal APIs**: Use JWT Bearer Token in header: `Authorization: Bearer <token>`
- **Agent APIs**: Use API Key in header: `X-Api-Key: ems_agent_api_key_2024`

---

## 🔐 Authentication Endpoints

### 1. **Login**
```http
POST /api/account/login
Content-Type: application/json

{
  "email": "admin@ems.com",
  "password": "Admin@1234"
}
```
**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "email": "admin@ems.com",
    "user_name": "EMS Admin",
    "role": "SuperAdmin",
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 👥 Staff Management Endpoints

### 2. **Get Staff Details with Filters**
```http
GET /api/account/getstaffdetailsbyfilter?department=Engineering&title=TL
Authorization: Bearer <token>
```
**Query Parameters:**
- `department` (optional) - Filter by department
- `title` (optional) - Filter by job title
- `search` (optional) - Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "empEmail": "john.doe@company.com",
      "empName": "John Doe",
      "status": "online",
      "computerName": "JOHN-PC",
      "ipAddress": "192.168.1.100",
      "lastSignal": "2 min ago",
      "isTracking": true,
      "isScreenShotDisable": false
    }
  ]
}
```

### 3. **Get All Employees**
```http
GET /api/account/getemployeelist
Authorization: Bearer <token>
```

### 4. **Get Department & Title Hierarchy**
```http
GET /api/account/getdepartmentandtitle
Authorization: Bearer <token>
```

### 5. **Assign Role to User**
```http
POST /api/account/assign-role
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "role": "Admin"
}
```

### 6. **Delete Management User**
```http
POST /api/account/deletemanagementuser
Authorization: Bearer <token>
Content-Type: application/json

{
  "empEmail": "john.doe@company.com"
}
```

### 7. **Get User List**
```http
GET /api/account/getuserlist
Authorization: Bearer <token>
```

---

## 📊 Dashboard Endpoints

### 8. **Get Dashboard Stats**
```http
GET /api/dashboard/getdashboarddata
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalUserCount": 6,
    "activeUserCount": 2,
    "totalIdleCount": 1,
    "longIdleCount": 0
  }
}
```

### 9. **Get Top 5 Productive/Distractive Apps**
```http
GET /api/dashboard/gettopfiveproddistract?startDate=2026-07-01&endDate=2026-07-13&Department=Engineering&Title=TL
Authorization: Bearer <token>
```
**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `Department` (optional) - Filter by department
- `Title` (optional) - Filter by title

**Response:**
```json
{
  "success": true,
  "data": {
    "topProductive": [
      { "name": "VS Code", "totalMinutes": 450, "type": "IDE" }
    ],
    "topDistracting": [
      { "name": "YouTube", "totalMinutes": 120, "type": "Video" }
    ]
  }
}
```

### 10. **Get Network Usage**
```http
GET /api/dashboard/getnetworkusages?startDate=2026-07-01&endDate=2026-07-13&empEmail=john@company.com
Authorization: Bearer <token>
```
**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `empEmail` (optional) - Filter by employee email

### 11. **Get Working Hours Data**
```http
GET /api/dashboard/getworkinghrsdata?startDate=2026-07-01&endDate=2026-07-13&pageNumber=1&pageSize=20
Authorization: Bearer <token>
```
**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `Department` (optional)
- `Title` (optional)
- `pageNumber` (optional, default: 1)
- `pageSize` (optional, default: 20)

---

## 📸 Screenshot Endpoints

### 12. **Upload Screenshot** (Agent)
```http
POST /api/screenshot/savescreenshot
X-Api-Key: ems_agent_api_key_2024
Content-Type: multipart/form-data

Form Data:
- screenshot: <file>
- email: john@company.com
- machineName: JOHN-PC
- capturedAt: 2026-07-13T14:30:00Z
- screenIndex: 1
```

### 13. **Get Screenshots**
```http
GET /api/screenshot/getscreenshots?email=john@company.com&date=2026-07-13
Authorization: Bearer <token>
```
**Query Parameters:**
- `email` - Employee email
- `date` (optional) - Specific date (YYYY-MM-DD)

---

## 📋 App Log Endpoints

### 14. **Save App Usage** (Agent)
```http
POST /api/applog/saveapplog
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "createdAt": "2026-07-13T14:30:00Z",
  "apps": [
    {
      "appName": "Visual Studio Code",
      "durationInMinutes": 120
    },
    {
      "appName": "Chrome",
      "durationInMinutes": 45
    }
  ]
}
```

### 15. **Get App Logs**
```http
GET /api/applog/getapplog?fromDate=2026-07-01&toDate=2026-07-13&emailId=john@company.com
Authorization: Bearer <token>
```
**Query Parameters:**
- `fromDate` - Start date (YYYY-MM-DD)
- `toDate` - End date (YYYY-MM-DD)
- `emailId` - Employee email

---

## ⏱️ Idle Endpoints

### 16. **Save Idle Log** (Agent)
```http
POST /api/idle/saveidle
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "idleStart": "2026-07-13T14:30:00Z",
  "idleEnd": "2026-07-13T14:35:00Z",
  "durationInMinutes": 5
}
```

### 17. **Get Idle Logs**
```http
GET /api/idle/getidle?email=john@company.com&from=2026-07-01&to=2026-07-13
Authorization: Bearer <token>
```

---

## 🌐 Browser History Endpoints

### 18. **Save Browser Usage** (Agent)
```http
POST /api/browserhistory/savebrowserusages
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "createdAt": "2026-07-13T14:30:00Z",
  "usage": [
    {
      "url": "https://github.com",
      "durationInMinutes": 30,
      "browser": "Chrome"
    },
    {
      "url": "https://stackoverflow.com",
      "durationInMinutes": 20,
      "browser": "Firefox"
    }
  ]
}
```

---

## 💻 Machine Endpoints

### 19. **Heartbeat** (Agent) - Sends config back
```http
POST /api/machine/heartbeat
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "ipAddress": "192.168.1.100"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "screenshot_interval_minutes": 5,
    "app_log_interval_minutes": 30,
    "idle_threshold_minutes": 5,
    "is_screenshot_enabled": true,
    "is_app_log_enabled": true
  }
}
```

### 20. **Save Network Usage** (Agent)
```http
POST /api/machine/savenetworkusage
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "uploadBytes": 1024000,
  "downloadBytes": 5120000
}
```

### 21. **Log Lock/Unlock Event** (Agent)
```http
POST /api/machine/loglockunlock
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "eventType": "lock",
  "eventTime": "2026-07-13T14:30:00Z"
}
```

### 22. **Save Geolocation** (Agent)
```http
POST /api/machine/savegeolocation
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "email": "john@company.com",
  "machineName": "JOHN-PC",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Gurgaon, India",
  "locationType": "office"
}
```

---

## 📈 Reports Endpoints

### 23. **Activity Log Report**
```http
GET /api/reports/activitylog?startDate=2026-07-01&endDate=2026-07-13&department=Engineering&title=TL
Authorization: Bearer <token>
```

### 24. **Activity Log By User**
```http
GET /api/reports/activitylogbyuser?startDate=2026-07-01&endDate=2026-07-13&empEmail=john@company.com
Authorization: Bearer <token>
```

### 25. **Working Hours Compliance**
```http
GET /api/reports/workinghrscompliance?date=2026-07-13&department=Engineering
Authorization: Bearer <token>
```

### 26. **Productivity Report**
```http
GET /api/reports/productivity?startDate=2026-07-01&endDate=2026-07-13&department=Engineering&title=TL
Authorization: Bearer <token>
```

---

## ⚙️ Settings Endpoints

### 27. **Get Shifts**
```http
GET /api/settings/shifts
Authorization: Bearer <token>
```

### 28. **Create Shift**
```http
POST /api/settings/shifts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Evening Shift",
  "country": "India",
  "working_days": "Mon-Fri",
  "start_time": "18:00:00",
  "end_time": "02:00:00",
  "working_hours": 8,
  "is_default": false,
  "created_by": "Admin"
}
```

### 29. **Update Shift**
```http
PUT /api/settings/shifts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Evening Shift",
  "working_hours": 9
}
```

### 30. **Delete Shift**
```http
DELETE /api/settings/shifts/:id
Authorization: Bearer <token>
```

### 31. **Assign Shift to Employee**
```http
POST /api/settings/shifts/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "empEmail": "john@company.com",
  "shiftId": 2
}
```

### 32. **Get Apps Master**
```http
GET /api/settings/apps?category=productive&type=App
Authorization: Bearer <token>
```

### 33. **Add App**
```http
POST /api/settings/apps
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Slack",
  "type": "App",
  "category": "neutral"
}
```

### 34. **Update App Category**
```http
PUT /api/settings/apps/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "productive"
}
```

### 35. **Get Time Settings**
```http
GET /api/settings/timesettings?email=john@company.com
Authorization: Bearer <token>
```

### 36. **Update Time Settings**
```http
POST /api/settings/timesettings
Authorization: Bearer <token>
Content-Type: application/json

{
  "empEmail": "john@company.com",
  "screenshot_interval_minutes": 5,
  "app_log_interval_minutes": 30,
  "idle_threshold_minutes": 5,
  "is_screenshot_enabled": true,
  "is_app_log_enabled": true,
  "is_tracking_enabled": true
}
```

### 37. **Toggle Service**
```http
POST /api/settings/timesettings/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "empEmail": "john@company.com",
  "service": "is_screenshot_enabled",
  "value": true
}
```

---

## Admin Endpoints

### 38. **Save Agent Logs**
```http
POST /api/admin/savelogs
X-Api-Key: ems_agent_api_key_2024
Content-Type: application/json

{
  "empEmail": "john@company.com",
  "machineName": "JOHN-PC",
  "eventType": "Success",
  "eventData": "Screenshots captured successfully",
  "createdAt": "2026-07-13T14:30:00Z"
}
```

### 39. **Get User Details**
```http
GET /api/admin/getuserdetailsbyemail?email=john@company.com
Authorization: Bearer <token>
```

### 40. **Get Session List**
```http
GET /api/admin/getsessionlist?email=john@company.com&from=2026-07-01&to=2026-07-13
Authorization: Bearer <token>
```

### 41. **Get Agent Logs**
```http
GET /api/admin/fetchlogdata?fromDate=2026-07-01&toDate=2026-07-13
Authorization: Bearer <token>
```

### 42. **Health Check**
```http
GET /api/admin/health
```
**Response:**
```json
{
  "status": "Healthy",
  "TimeStamp": "2026-07-13T14:30:00Z"
}
```



---

# License

This project is intended for educational, demonstration, and portfolio purposes.

---

# Author

**Ravinder Nath**

- GitHub:
- LinkedIn: www.linkedin.com/in/ravinder-nath-6828a856

If you found this project useful, please consider giving it a ⭐ on GitHub.