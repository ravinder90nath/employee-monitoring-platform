import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const NAV = [
  { section:'MAIN' },
  { id:'dashboard',  path:'/dashboard', icon:'⬡', label:'Office Dashboard' },
  { id:'staff',      path:'/staff',     icon:'👤', label:'Staff Dashboard' },
  { id:'users',      path:'/users',     icon:'👥', label:'User Management' },
  { section:'REPORTS' },
  { id:'activity',   path:'/reports/activity',     icon:'📋', label:'Activity Log' },
  { id:'compliance', path:'/reports/compliance',   icon:'⏱',  label:'Working Hrs Compliance' },
  { id:'prodreport', path:'/reports/productivity', icon:'📊', label:'Productivity Report' },
  { section:'SETTINGS' },
  { id:'calendar',   path:'/settings/calendar',       icon:'📅', label:'Calendar / Shift' },
  { id:'manprod',    path:'/settings/productivity',   icon:'⚡', label:'Manage Productivity' },
  { id:'manadmin',   path:'/settings/admin',          icon:'🔐', label:'Manage Admin' },
  { id:'timeset',    path:'/settings/time',           icon:'⏰', label:'Time Settings' },
  { id:'manservice', path:'/settings/manage-service', icon:'⚙', label:'Manage-service' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isActive = p => pathname === p;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={onToggle}>
        <div className="sidebar-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && <div className="sidebar-logo-text">EMS<span>INTL</span></div>}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (item.section) {
            return !collapsed
              ? <div key={i} className="nav-section">{item.section}</div>
              : <div key={i} style={{ height: 10 }} />;
          }
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(user?.userName || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="sidebar-user-name">{user?.userName || 'Admin'}</div>
              <div className="sidebar-user-role">{user?.role || 'SuperAdmin'}</div>
            </div>
          </div>
        )}
        <div className="nav-item logout-btn" onClick={logout} title="Logout">
          <span className="nav-icon">↪</span>
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
