import React, { useState, useEffect } from 'react';
import useFetch from '../../../hooks/useFetch';
import { staffService } from '../../../services/staff.service';
import { authService } from '../../../services/auth.service';
import { authFetch } from '../../../services/api';
import { EmptyState, LoadingCenter } from '../../../components/common';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PillSelector = ({ opts, value, onChange }) => (
  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
    {opts.map(v => (
      <button key={v} onClick={() => onChange(v)} style={{
        padding:'5px 14px', borderRadius:20,
        border:`1px solid ${value===v?'var(--primary)':'var(--border2)'}`,
        background: value===v ? 'var(--primary)' : 'transparent',
        color: value===v ? '#fff' : 'var(--text2)',
        cursor:'pointer', fontSize:12, fontFamily:'var(--font)',
        fontWeight: value===v ? 600 : 400, transition:'all .15s',
      }}>{v}m</button>
    ))}
  </div>
);

const StatBadge = ({ icon, label, value, bg }) => (
  <div className="card" style={{ flex:'1 1 150px', padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
    <div style={{ width:36, height:36, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
    <div>
      <div style={{ fontSize:11, color:'var(--text2)', fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:700 }}>{value}m</div>
    </div>
  </div>
);

const TimeSettings = () => {
  const { data:empList } = useFetch(() => authService.getEmployeeList(), []);
  const [deptList,   setDeptList]   = useState([]);
  const [dept,       setDept]       = useState('');
  const [title,      setTitle]      = useState('');
  const [selEmail,   setSelEmail]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');
  const [current,    setCurrent]    = useState({ idle:0, ss:0, app:0, loc:0 });
  const [form,       setForm]       = useState({
    screenshot_interval_minutes:5, app_log_interval_minutes:30,
    browser_log_interval_minutes:30, idle_threshold_minutes:5,
    geolocation_interval_minutes:5,
    is_screenshot_enabled:true, is_app_log_enabled:true,
    is_browser_log_enabled:true, is_idle_enabled:true,
    is_geolocation_enabled:false, is_tracking_enabled:true,
  });

  useEffect(() => {
    authFetch(`${API_URL}/account/getdepartmentandtitle`)
      .then(d => setDeptList(d?.departmentTitles || []));
  }, []);

  const titles = deptList.find(d => d.department === dept)?.titles || [];

  const { data:settings, loading, refetch } = useFetch(
    () => selEmail ? staffService.getTimeSetting(selEmail) : Promise.resolve({ data:{ data:null } }),
    [selEmail]
  );

  useEffect(() => {
    if (!settings) return;
    const f = {
      screenshot_interval_minutes:  parseInt(settings.screenshot_interval_minutes)  || 5,
      app_log_interval_minutes:     parseInt(settings.app_log_interval_minutes)     || 30,
      browser_log_interval_minutes: parseInt(settings.browser_log_interval_minutes) || 30,
      idle_threshold_minutes:       parseInt(settings.idle_threshold_minutes)        || 5,
      geolocation_interval_minutes: 5,
      is_screenshot_enabled:  settings.is_screenshot_enabled  !== 0 && settings.is_screenshot_enabled  !== false,
      is_app_log_enabled:     settings.is_app_log_enabled     !== 0 && settings.is_app_log_enabled     !== false,
      is_browser_log_enabled: settings.is_browser_log_enabled !== 0 && settings.is_browser_log_enabled !== false,
      is_idle_enabled:        settings.is_idle_enabled        !== 0 && settings.is_idle_enabled        !== false,
      is_geolocation_enabled: settings.is_geolocation_enabled === 1  || settings.is_geolocation_enabled === true,
      is_tracking_enabled:    settings.is_tracking_enabled    !== 0 && settings.is_tracking_enabled    !== false,
    };
    setForm(f);
    setCurrent({ idle:f.idle_threshold_minutes, ss:f.screenshot_interval_minutes, app:f.app_log_interval_minutes, loc:5 });
  }, [settings]);

  const handleSave = async () => {
    if (!selEmail) { setError('Please select an employee'); return; }
    setSaving(true); setError('');
    try {
      await staffService.updateTimeSettings({ ...form, empEmail:selEmail });
      setCurrent({ idle:form.idle_threshold_minutes, ss:form.screenshot_interval_minutes, app:form.app_log_interval_minutes, loc:form.geolocation_interval_minutes });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      refetch();
    } catch(e) { setError('Save failed: ' + (e.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const SERVICES = [
    { key:'is_screenshot_enabled',   label:'Screenshot Capture',   desc:'Periodic screenshots of employee screen' },
    { key:'is_app_log_enabled',      label:'Application Logging',  desc:'Track which apps are used and duration' },
    { key:'is_browser_log_enabled',  label:'Browser History',      desc:'Track websites visited' },
    { key:'is_idle_enabled',         label:'Idle Detection',       desc:'Detect keyboard/mouse inactivity' },
    { key:'is_geolocation_enabled',  label:'Geolocation',          desc:'Log employee physical location' },
    { key:'is_tracking_enabled',     label:'Master Tracking',      desc:'Enable/disable ALL tracking' },
  ];

  const INTERVALS = [
    { label:'Idle Time Detection',    desc:'Time before marking user as idle',          key:'idle_threshold_minutes',       opts:[1,2,3,5,10,15,20,30],      bg:'rgba(139,87,229,.15)', icon:'⏸' },
    { label:'Screenshot Capture',     desc:'Interval between screenshot captures',      key:'screenshot_interval_minutes',  opts:[2,5,10,15,20,25,30,35,40,45,50], bg:'rgba(248,81,73,.15)', icon:'📷' },
    { label:'App/Browser Logging',    desc:'Frequency of application and browser logging', key:'app_log_interval_minutes', opts:[1,2,5,10,15,30],           bg:'rgba(45,140,240,.15)', icon:'📋' },
    { label:'Location Tracking',      desc:'Interval for location data collection',     key:'geolocation_interval_minutes', opts:[5,10,15,30,60],             bg:'rgba(63,185,80,.15)',  icon:'📍' },
  ];

  const currentVals = [current.idle, current.ss, current.app, current.loc];

  return (
    <div>
      {/* Employee selector */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>👤</div>
        <select className="form-input form-select" style={{ width:180 }} value={dept} onChange={e=>{setDept(e.target.value);setTitle('');setSelEmail('');}}>
          <option value="">Select Department...</option>
          {deptList.map(d=><option key={d.department} value={d.department}>{d.department}</option>)}
        </select>
        <select className="form-input form-select" style={{ width:150 }} value={title} onChange={e=>{setTitle(e.target.value);setSelEmail('');}}>
          <option value="">Select Title...</option>
          {titles.map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
        </select>
        <select className="form-input form-select" style={{ width:240 }} value={selEmail} onChange={e=>setSelEmail(e.target.value)}>
          <option value="">Select Employee...</option>
          {(empList||[]).map(e=><option key={e.emp_email} value={e.emp_email}>{e.emp_name} ({e.emp_email})</option>)}
        </select>
        {selEmail && !loading && <span style={{ fontSize:12, color:'var(--green)' }}>✓ Loaded</span>}
      </div>

      {!selEmail ? (
        <EmptyState icon="⏰" title="Select an employee" sub="Choose an employee to configure tracking settings"/>
      ) : loading ? <LoadingCenter msg="Loading settings..."/> : (
        <>
          {error && <div style={{ background:'var(--red-dim)', border:'1px solid rgba(248,81,73,.25)', color:'var(--red)', padding:'10px 14px', borderRadius:8, marginBottom:14, fontSize:13 }}>{error}</div>}

          {/* Stat badges */}
          <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            {[['⏸','Idle Time','rgba(139,87,229,.15)'],['📷','Screenshots','rgba(248,81,73,.15)'],['📋','App Logs','rgba(45,140,240,.15)'],['📍','Location','rgba(63,185,80,.15)']].map(([icon,label,bg],i)=>(
              <StatBadge key={label} icon={icon} label={label} value={currentVals[i]} bg={bg}/>
            ))}
          </div>

          {/* Interval cards */}
          <div className="grid-2" style={{ marginBottom:20 }}>
            {INTERVALS.map(({ label, desc, key, opts, bg, icon }) => (
              <div key={key} className="card card-pad">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:38, height:38, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
                  <div><div style={{ fontWeight:600, fontSize:14 }}>{label}</div><div style={{ fontSize:11, color:'var(--text2)' }}>{desc}</div></div>
                </div>
                <div style={{ fontWeight:500, fontSize:12, color:'var(--text2)', marginBottom:4 }}>
                  {label.includes('Idle')?'Idle Time Threshold':label.includes('Screenshot')?'Screenshot Interval':label.includes('App')?'App Log Interval':'Location Update Interval'}
                </div>
                <PillSelector opts={opts} value={form[key]} onChange={v => setForm({...form,[key]:v})}/>
                <div style={{ marginTop:10 }}>
                  <span style={{ background:'var(--primary)', color:'#fff', padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:600 }}>
                    Current: {form[key]} minutes
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Service toggles */}
          <div className="card card-pad" style={{ marginBottom:20 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>🔧 Services Enable / Disable</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {SERVICES.map((s, i) => (
                <div key={s.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:i<SERVICES.length-2?'1px solid var(--border)':'none', borderRight:i%2===0?'1px solid var(--border)':'none' }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:13 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{s.desc}</div>
                  </div>
                  <label className="toggle" style={{ marginLeft:16 }}>
                    <input type="checkbox" checked={!!form[s.key]} onChange={e=>setForm({...form,[s.key]:e.target.checked})}/>
                    <span className="toggle-slider"/>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:12 }}>
            {saved && <span style={{ color:'var(--green)', fontWeight:500, fontSize:13 }}>✓ Settings saved!</span>}
            <button onClick={handleSave} disabled={saving}
              style={{ background:saving?'var(--bg4)':'var(--green)', color:'#fff', border:'none', borderRadius:8, padding:'10px 28px', fontSize:14, fontWeight:600, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}>
              ⟳ {saving?'Updating...':'Update Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TimeSettings;
