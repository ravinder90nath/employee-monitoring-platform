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

---

## API Routes

### Portal (Bearer JWT)
| Method | Path | Description |
|---|---|---|
| POST | /api/account/login | Login |
| GET | /api/account/getstaffdetailsbyfilter | Employee list with status |
| GET | /api/dashboard/getdashboarddata | Stats |
| GET | /api/dashboard/gettopfiveproddistract | Top 5 apps |
| GET | /api/screenshot/getscreenshots | Screenshots |
| GET | /api/reports/activitylog | Activity report |
| GET | /api/reports/workinghrscompliance | Compliance |
| GET | /api/reports/productivity | Productivity |
| GET/POST/PUT/DELETE | /api/settings/shifts | Shift management |
| GET/POST/PUT | /api/settings/apps | App categories |
| GET/POST | /api/settings/timesettings | Time settings |

### Agent (X-Api-Key header)
| Method | Path | Description |
|---|---|---|
| POST | /api/machine/heartbeat | Heartbeat (returns config) |
| POST | /api/applog/saveapplog | App usage |
| POST | /api/screenshot/savescreenshot | Screenshot upload |
| POST | /api/idle/saveidle | Idle log |
| POST | /api/machine/savenetworkusage | Network stats |
| POST | /api/browserhistory/savebrowserusages | Browser history |
