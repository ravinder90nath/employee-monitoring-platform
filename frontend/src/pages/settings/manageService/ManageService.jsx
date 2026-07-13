import React, { useState, useEffect } from 'react';
import { authFetch } from '../../../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SERVICE_MAP = {
  Screenshot: 'is_screenshot_enabled',
  Geolocation: 'is_geolocation_enabled',
  Idletime: 'is_idle_enabled',
  Applog: 'is_app_log_enabled',
  'All Services': null,
};

const ManageService = () => {
  const [selService, setSelService] = useState('Screenshot');
  const [applyAll,   setApplyAll]   = useState(false);
  const [dept,       setDept]       = useState('');
  const [title,      setTitle]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [deptList,   setDeptList]   = useState([]);

  useEffect(() => {
    authFetch(`${API_URL}/account/getdepartmentandtitle`)
      .then(d => setDeptList(d?.departmentTitles || []));
  }, []);

  const titles = deptList.find(d => d.department === dept)?.titles || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const services = selService === 'All Services'
        ? ['is_screenshot_enabled','is_geolocation_enabled','is_idle_enabled','is_app_log_enabled']
        : [SERVICE_MAP[selService]];

      if (applyAll) {
        const emps = await authFetch(`${API_URL}/account/getemployeelist`);
        const empList = Array.isArray(emps) ? emps : [];
        for (const emp of empList) {
          for (const svc of services) {
            await fetch(`${API_URL}/settings/timesettings/toggle`, {
              method:'POST',
              headers:{ Authorization:`Bearer ${localStorage.getItem('ems_token')}`, 'Content-Type':'application/json' },
              body: JSON.stringify({ empEmail:emp.emp_email, service:svc, value:1 })
            });
          }
        }
      } else if (dept || title) {
        let q = `${API_URL}/account/getstaffdetailsbyfilter?`;
        if (dept)  q += `department=${dept}&`;
        if (title) q += `title=${title}`;
        const staff = await authFetch(q);
        const staffList = Array.isArray(staff) ? staff : [];
        for (const emp of staffList) {
          for (const svc of services) {
            await fetch(`${API_URL}/settings/timesettings/toggle`, {
              method:'POST',
              headers:{ Authorization:`Bearer ${localStorage.getItem('ems_token')}`, 'Content-Type':'application/json' },
              body: JSON.stringify({ empEmail:emp.empEmail, service:svc, value:1 })
            });
          }
        }
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch(e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="card" style={{ width:560, padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:40, height:40, borderRadius:8, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>⚙</div>
          <div style={{ fontWeight:700, fontSize:16 }}>Manage Services</div>
        </div>

        <div className="form-group">
          <label className="form-label">Select Service</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
            {Object.keys(SERVICE_MAP).map(s => (
              <button key={s} onClick={() => setSelService(s)} style={{
                padding:'6px 16px', borderRadius:20,
                border:`1px solid ${selService===s?'var(--primary)':'var(--border2)'}`,
                background:'transparent',
                color: selService===s ? 'var(--primary)' : 'var(--text2)',
                cursor:'pointer', fontSize:13, fontFamily:'var(--font)',
                fontWeight: selService===s ? 600 : 400, transition:'all .15s',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
          <label className="toggle">
            <input type="checkbox" checked={applyAll} onChange={e => setApplyAll(e.target.checked)}/>
            <span className="toggle-slider"/>
          </label>
          <span style={{ fontSize:13 }}>Apply to All Users</span>
        </div>

        {!applyAll && (<>
          <div className="form-group">
            <label className="form-label">Select Department</label>
            <select className="form-input form-select" value={dept} onChange={e=>{setDept(e.target.value);setTitle('');}}>
              <option value="">Select Department...</option>
              {deptList.map(d=><option key={d.department} value={d.department}>{d.department}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Select Title</label>
            <select className="form-input form-select" value={title} onChange={e=>setTitle(e.target.value)}>
              <option value="">Select Title...</option>
              {titles.map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
            </select>
          </div>
        </>)}

        {saved && <div style={{ color:'var(--green)', fontSize:13, fontWeight:500, marginBottom:10 }}>✓ Service settings saved!</div>}

        <button onClick={handleSave} disabled={saving || (!applyAll && !dept && !title)} style={{
          width:'100%', background:saving?'var(--bg4)':'var(--green)', color:'#fff',
          border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600,
          cursor: saving?'not-allowed':'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>💾 {saving?'Saving...':'Save'}</button>
      </div>
    </div>
  );
};

export default ManageService;
