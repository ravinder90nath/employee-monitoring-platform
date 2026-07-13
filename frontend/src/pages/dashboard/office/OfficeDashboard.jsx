import React, { useState, useEffect } from 'react';
import useFetch from '../../../hooks/useFetch';
import useDeptTitles from '../../../hooks/useDeptTitles';
import { dashboardService } from '../../../services/dashboard.service';
import StatCards from './components/StatCards';
import Top5Chart from './components/Top5Chart';
import NetworkChart from './components/NetworkChart';
import AttendancePanel from './components/AttendancePanel';
import ProductivityScore from './components/ProductivityScore';
import { today, weekAgo } from '../../../utils/helpers';

const OfficeDashboard = () => {
  const [from,  setFrom]  = useState(weekAgo());
  const [to,    setTo]    = useState(today());
  const [dept,  setDept]  = useState('');
  const [title, setTitle] = useState('');
  const [view,  setView]  = useState('Day');

  const { deptTitles } = useDeptTitles();
  const { data: stats, refetch } = useFetch(() => dashboardService.getData(), []);

  // Auto-refresh stats every 60s
  useEffect(() => {
    const t = setInterval(refetch, 60000);
    return () => clearInterval(t);
  }, [refetch]);

  const titles = deptTitles.find(d => d.department === dept)?.titles || [];

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <select className="form-input form-select" style={{ width:180 }}
          value={dept} onChange={e => { setDept(e.target.value); setTitle(''); }}>
          <option value="">Select Department...</option>
          {deptTitles.map(d => <option key={d.department} value={d.department}>{d.department}</option>)}
        </select>
        <select className="form-input form-select" style={{ width:150 }}
          value={title} onChange={e => setTitle(e.target.value)}>
          <option value="">Select Title...</option>
          {titles.map(t => <option key={t.title} value={t.title}>{t.title}</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <div className="date-filter"><input type="date" value={from} onChange={e => setFrom(e.target.value)}/></div>
          <div className="date-filter"><input type="date" value={to}   onChange={e => setTo(e.target.value)}/></div>
          <div style={{ display:'flex', border:'1px solid var(--border2)', borderRadius:6, overflow:'hidden' }}>
            {['Day','Week','Month'].map(m => (
              <button key={m} onClick={() => setView(m)} style={{
                padding:'5px 12px', fontSize:12, fontWeight:500, border:'none', cursor:'pointer',
                fontFamily:'var(--font)', background:view===m?'var(--primary)':'transparent',
                color:view===m?'#fff':'var(--text2)',
              }}>{m}</button>
            ))}
          </div>
          <button onClick={refetch} style={{ width:30, height:30, background:'var(--primary)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:16 }}>⟳</button>
        </div>
      </div>

      {/* Stat cards */}
      <StatCards data={stats} />

      {/* Row 1 */}
      <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
        <Top5Chart from={from} to={to} dept={dept} title={title} />
        <AttendancePanel />
      </div>

      {/* Row 2 */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <NetworkChart from={from} to={to} />
        <ProductivityScore from={from} to={to} dept={dept} title={title} />
      </div>
    </div>
  );
};

export default OfficeDashboard;
