import React, { useState, useEffect } from 'react';
import { authFetch } from '../../../services/api';
import { screenshotService } from '../../../services/screenshot.service';
import useFetch from '../../../hooks/useFetch';
import useEmployeeList from '../../../hooks/useEmployeeList';
import { LoadingCenter } from '../../../components/common';
import TimelineBar   from './components/TimelineBar';
import WorkStatsRow  from './components/WorkStatsRow';
import ActivitiesPanel from './components/ActivitiesPanel';
import ScreenshotsPanel from './components/ScreenshotsPanel';
import WeeklyView    from './components/WeeklyView';
import BrowserHistoryPanel from './components/BrowserHistoryPanel';
import { browserService } from '../../../services/browser.service';
import AppLogsPanel from './components/AppLogsPanel';
import { today, weekAgo } from '../../../utils/helpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TabBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
    background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)',
    fontSize:13, fontWeight:500,
    color: active ? 'var(--primary)' : 'var(--text2)',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    marginBottom:-1, transition:'all .15s',
  }}>{icon} {label}</button>
);

const StaffDashboard = () => {
  const [selEmail,   setSelEmail]   = useState('');
  const [date,       setDate]       = useState(today());
  const [viewMode,   setViewMode]   = useState('Day');
  const [activeTab,  setActiveTab]  = useState('activities');
  const [appData,    setAppData]    = useState([]);
  const [appLogs,    setAppLogs]    = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [network,    setNetwork]    = useState(null);
  const [idleMins,   setIdleMins]   = useState(0);
  const [idleLogs,   setIdleLogs]   = useState([]);
  const [browserRows,setBrowserRows] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [dataLoading,setDataLoading]= useState(false);

  const from = viewMode === 'Week'
    ? (() => { const d=new Date(date); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.toISOString().split('T')[0]; })()
    : date;
  const to = viewMode === 'Week'
    ? (() => { const d=new Date(from); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0]; })()
    : date;

  const { employees } = useEmployeeList();
  const selectedEmployee = employees.find(e => e.emp_email === selEmail);

  useEffect(() => {
    if (employees.length && !selEmail) setSelEmail(employees[0].emp_email);
  }, [employees]);

  useEffect(() => {
    if (!selEmail) return;
    setDataLoading(true);
    Promise.all([
      authFetch(`${API_URL}/applog/getapplog?fromDate=${from}&toDate=${to}&emailId=${selEmail}`),
      authFetch(`${API_URL}/admin/getsessionlist?email=${selEmail}&from=${from}&to=${to}`),
      authFetch(`${API_URL}/dashboard/getnetworkusages?startDate=${from}&endDate=${to}`),
      authFetch(`${API_URL}/idle?email=${selEmail}&from=${from}&to=${to}`).catch(() => null),
    ]).then(([appResp, sessResp, netResp, idleResp]) => {
      setAppData(appResp?.aggregated || []);
      const rawGroup = Array.isArray(appResp?.raw)
        ? (appResp.raw.find(g => g.employeeEmail === selEmail) || appResp.raw[0] || { appdata: [] })
        : { appdata: [] };
      setAppLogs(Array.isArray(rawGroup.appdata) ? rawGroup.appdata : []);
      setSessions(Array.isArray(sessResp) ? sessResp : []);
      const nets = Array.isArray(netResp) ? netResp : [];
      setNetwork(nets.find(n => n.empEmail === selEmail || n.emp_email === selEmail) || null);
      if (idleResp) {
        const arr   = Array.isArray(idleResp) ? idleResp : (idleResp?.data || []);
        setIdleLogs(arr);
        const total = arr.reduce((s, r) => s + (parseFloat(r.duration_minutes) || 0), 0);
        setIdleMins(total);
      } else { setIdleLogs([]); setIdleMins(0); }
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, [selEmail, from, to]);

  useEffect(() => {
    if (!selEmail) return;
    const f = from, t = to;
    browserService.get(selEmail, f, t).then(resp => {
      const rows = resp?.data || resp || [];
      setBrowserRows(Array.isArray(rows) ? rows : (rows.data || []));
    }).catch(() => setBrowserRows([]));
    // fetch agent logs for date range
    // keep agentLogs for other uses; app data shown in App Logs tab
    // adminService.getAgentLogs(f, t).then(r => setAgentLogs(r?.data || r || [])).catch(() => setAgentLogs([]));
  }, [selEmail, from, to]);

  const { data: rawShots, loading: ssLoading } = useFetch(
    () => selEmail ? screenshotService.get(selEmail, date) : Promise.resolve({ data:{ data:[] } }),
    [selEmail, date]
  );
  const shots = Array.isArray(rawShots) ? rawShots : [];

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <select className="form-input form-select" style={{ width:260 }}
          value={selEmail} onChange={e => setSelEmail(e.target.value)}>
          <option value="">Select Employee</option>
          {employees.map(e => <option key={e.emp_email} value={e.emp_email}>{e.emp_name} ({e.emp_email})</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <div className="date-filter"><input type="date" value={date} onChange={e => setDate(e.target.value)}/></div>
          <div style={{ display:'flex', border:'1px solid var(--border2)', borderRadius:6, overflow:'hidden' }}>
            {['Day','Week','Month'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding:'5px 12px', fontSize:12, fontWeight:500, border:'none', cursor:'pointer', fontFamily:'var(--font)',
                background:m===viewMode?'var(--primary)':'transparent', color:m===viewMode?'#fff':'var(--text2)',
              }}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="card card-pad">
        {/* Legend */}
        <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:10 }}>
          {[['#3fb950','Productive'],['#f85149','Distracting'],['#e3b341','No Activity']].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <div style={{ width:12, height:12, borderRadius:2, background:c }}/><span style={{ color:'var(--text2)' }}>{l}</span>
            </div>
          ))}
        </div>

        <TimelineBar
          apps={appData}
          appLogs={appLogs}
          idleLogs={idleLogs}
          sessions={sessions}
          shiftStart={selectedEmployee?.shift_start}
          shiftEnd={selectedEmployee?.shift_end}
          date={date}
          idleMins={idleMins}
        />

        <WorkStatsRow
          sessions={sessions} idleMins={idleMins}
          networkUp={network?.totalUploadBytes || network?.total_upload_bytes || 0}
          networkDown={network?.totalDownloadBytes || network?.total_download_bytes || 0}
        />

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:16 }}>
          <TabBtn active={activeTab==='activities'}  onClick={() => setActiveTab('activities')}  icon="📋" label="Activities"/>
          <TabBtn active={activeTab==='screenshots'} onClick={() => setActiveTab('screenshots')} icon="🖥" label="Screenshots"/>
          <TabBtn active={activeTab==='location'}    onClick={() => setActiveTab('location')}    icon="📍" label="Location"/>
          {viewMode==='Week' && <TabBtn active={activeTab==='weekly'} onClick={() => setActiveTab('weekly')} icon="📅" label="Weekly View"/>}
          <TabBtn active={activeTab==='browser'} onClick={() => setActiveTab('browser')} icon="🌐" label="Browser"/>
          <TabBtn active={activeTab==='agentlogs'} onClick={() => setActiveTab('agentlogs')} icon="📝" label="App Logs"/>
        </div>

        {activeTab === 'activities'  && (dataLoading ? <LoadingCenter msg="Loading activities..."/> : <ActivitiesPanel apps={appData} idleMins={idleMins}/>)}
        {activeTab === 'browser' && <BrowserHistoryPanel rows={browserRows} />}
        {activeTab === 'agentlogs' && <AppLogsPanel aggregated={appData} />}
        {activeTab === 'screenshots' && (ssLoading   ? <LoadingCenter msg="Loading screenshots..."/> : <ScreenshotsPanel shots={shots} date={date}/>)}
        {activeTab === 'location'    && (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--text2)' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📍</div>
            <div>Location tracking not enabled</div>
          </div>
        )}
        {activeTab === 'weekly' && viewMode === 'Week' && <WeeklyView email={selEmail} from={from} to={to}/>}
      </div>
    </div>
  );
};

export default StaffDashboard;
