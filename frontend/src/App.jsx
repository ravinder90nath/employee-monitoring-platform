import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AppLayout        from './components/layout/AppLayout';
import ProtectedRoute   from './components/layout/ProtectedRoute';

// Auth
import Login            from './pages/auth/Login';

// Dashboard
import OfficeDashboard  from './pages/dashboard/office/OfficeDashboard';
import StaffDashboard   from './pages/dashboard/staff/StaffDashboard';

// Users
import UserManagement   from './pages/users/UserManagement';

// Reports
import ActivityLog           from './pages/reports/activityLog/ActivityLog';
import WorkingHoursCompliance from './pages/reports/workingHours/WorkingHoursCompliance';
import ProductivityReport    from './pages/reports/productivity/ProductivityReport';

// Settings
import CalendarSettings    from './pages/settings/calendar/CalendarSettings';
import ManageProductivity  from './pages/settings/manageProductivity/ManageProductivity';
import ManageAdmin         from './pages/settings/manageAdmin/ManageAdmin';
import TimeSettings        from './pages/settings/timeSettings/TimeSettings';
import ManageService       from './pages/settings/manageService/ManageService';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"               element={<OfficeDashboard />} />
          <Route path="staff"                   element={<StaffDashboard />} />
          <Route path="users"                   element={<UserManagement />} />
          <Route path="reports/activity"        element={<ActivityLog />} />
          <Route path="reports/compliance"      element={<WorkingHoursCompliance />} />
          <Route path="reports/productivity"    element={<ProductivityReport />} />
          <Route path="settings/calendar"       element={<CalendarSettings />} />
          <Route path="settings/productivity"   element={<ManageProductivity />} />
          <Route path="settings/admin"          element={<ManageAdmin />} />
          <Route path="settings/time"           element={<TimeSettings />} />
          <Route path="settings/manage-service" element={<ManageService />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
