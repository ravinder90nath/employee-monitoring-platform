import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="page-main">
        <Topbar onToggle={() => setCollapsed(c => !c)} />
        <div className="page-body"><Outlet /></div>
      </div>
    </div>
  );
};
export default AppLayout;
