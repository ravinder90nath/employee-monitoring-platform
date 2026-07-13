import React from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const TITLES = {
  '/dashboard':'Office Dashboard', '/staff':'Staff Dashboard',
  '/users':'User Management',
  '/reports/activity':'Activity Log',
  '/reports/compliance':'Working Hours Compliance',
  '/reports/productivity':'Productivity Report',
  '/settings/calendar':'Calendar / Shift Management',
  '/settings/productivity':'Manage Productivity',
  '/settings/admin':'Manage Admin',
  '/settings/time':'Time Settings',
  '/settings/manage-service':'Manage Service',
};

const Topbar = ({ onToggle }) => {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  return (
    <div className="topbar">
      <button className="topbar-toggle" onClick={onToggle}>☰</button>
      <div className="topbar-title">{TITLES[pathname] || 'EMS INTL'}</div>
      <div className="topbar-right">
        <div className="topbar-date">
          {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
        </div>
        <div className="topbar-divider"/>
        <div className="topbar-user">
          <div style={{ width:28, height:28, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12 }}>
            {(user?.userName || 'A')[0].toUpperCase()}
          </div>
          <div>
            <div className="topbar-user-name">{user?.userName || 'Admin'}</div>
            <div className="topbar-user-role">{user?.role || 'SuperAdmin'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
