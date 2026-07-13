import React, { useState, useEffect } from 'react';
import useFetch from '../../../hooks/useFetch';
import { settingsService } from '../../../services/settings.service';
import { authFetch } from '../../../services/api';
import { Button, EmptyState, Badge, LoadingCenter } from '../../../components/common';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const FULL  = { Sun:'Sunday', Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday' };

const defaultForm = () => ({
  name:'', country:'India', timezone:'IST', year: new Date().getFullYear().toString(),
  days:{ Mon:{on:true,start:'09:30',end:'18:30'}, Tue:{on:true,start:'09:30',end:'18:30'},
    Wed:{on:true,start:'09:30',end:'18:30'}, Thu:{on:true,start:'09:30',end:'18:30'},
    Fri:{on:true,start:'09:30',end:'18:30'}, Sat:{on:true,start:'12:00',end:'18:30'}, Sun:{on:false,start:'09:00',end:'17:00'} }
});

const CalendarSettings = () => {
  const { data:shifts, loading, refetch } = useFetch(() => settingsService.getShifts(), []);
  const [selected,    setSelected]    = useState(null);
  const [form,        setForm]        = useState(defaultForm());
  const [empList,     setEmpList]     = useState([]);
  const [selEmps,     setSelEmps]     = useState([]);
  const [empSearch,   setEmpSearch]   = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    authFetch(`${API_URL}/account/getemployeelist`)
      .then(d => setEmpList(Array.isArray(d) ? d : []));
  }, []);

  const openEdit = s => {
    setSelected(s);
    const start = s.start_time?.slice(0,5) || '09:30';
    const end   = s.end_time?.slice(0,5)   || '18:30';
    setForm({ name:s.name, country:s.country||'India', timezone:'IST', year: new Date().getFullYear().toString(),
      days:{ Mon:{on:true,start,end}, Tue:{on:true,start,end}, Wed:{on:true,start,end},
        Thu:{on:true,start,end}, Fri:{on:true,start,end},
        Sat:{on:s.working_days?.includes('Sat'),start,end}, Sun:{on:false,start:'09:00',end:'17:00'} }
    });
  };

  const openNew = () => { setSelected(null); setForm(defaultForm()); setSelEmps([]); };

  const calcHrs = (start, end) => {
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    const m = (eh*60+em)-(sh*60+sm);
    return m > 0 ? `${Math.floor(m/60)}hr` : '0hr';
  };

  const save = async () => {
    if (!form.name.trim()) return alert('Shift name required');
    setSaving(true);
    try {
      const activeDays = Object.entries(form.days).filter(([,v]) => v.on);
      const first = activeDays[0];
      const payload = { name:form.name, country:form.country,
        working_days: activeDays.map(([d]) => d).join('-'),
        start_time: first ? first[1].start+':00' : '09:30:00',
        end_time:   first ? first[1].end+':00'   : '18:30:00',
        working_hours:9, is_default:false };
      let shiftId;
      if (selected) { await settingsService.updateShift(selected.id, payload); shiftId = selected.id; }
      else { const r = await settingsService.createShift(payload); shiftId = r.data?.data?.id || r.data?.id; }
      for (const email of selEmps) await settingsService.assignShift(email, shiftId);
      refetch(); openNew();
    } catch(e) { alert('Save failed: '+e.message); }
    setSaving(false);
  };

  const del = async id => {
    if (!window.confirm('Delete this shift?')) return;
    await settingsService.deleteShift(id); refetch();
  };

  const filteredEmps = empList.filter(e =>
    !empSearch || e.emp_name?.toLowerCase().includes(empSearch.toLowerCase()) || e.emp_email?.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* Shift list */}
        <div style={{ minWidth:200 }}>
          <div style={{ fontWeight:600, marginBottom:10 }}>Shifts</div>
          {loading ? <LoadingCenter/> : (shifts||[]).map(s => (
            <div key={s.id} onClick={() => openEdit(s)}
              style={{ padding:'10px 14px', borderRadius:8, cursor:'pointer', marginBottom:6,
                border:'1px solid var(--border)', background:selected?.id===s.id?'var(--primary-dim)':'var(--bg2)',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, fontWeight:500 }}>{s.name}</span>
              <button onClick={e=>{e.stopPropagation();del(s.id);}}
                style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:16 }}>🗑</button>
            </div>
          ))}
          {!(shifts||[]).length && <EmptyState icon="📅" title="No shifts" sub="Create a shift"/>}
          <Button variant="ghost" className="w-full" style={{ marginTop:8 }} onClick={openNew}>+ New Shift</Button>
        </div>

        {/* Editor */}
        <div className="card" style={{ flex:'1 1 380px', padding:20 }}>
          <div className="form-group">
            <label className="form-label">* Shift Name</label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="India Shift Default"/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">* Time Zone</label>
              <select className="form-input form-select" value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}>
                <option value="IST">IST (India)</option><option value="EST">EST (US East)</option>
                <option value="PST">PST (US West)</option><option value="GMT">GMT (UK)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">* Year</label>
              <select className="form-input form-select" value={form.year} onChange={e=>setForm({...form,year:e.target.value})}>
                {['2025','2026','2027'].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {DAYS.map(day => (
            <div key={day} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop:'1px solid var(--border)' }}>
              <input type="checkbox" checked={form.days[day]?.on||false}
                onChange={e=>setForm({...form,days:{...form.days,[day]:{...form.days[day],on:e.target.checked}}})}
                style={{ width:16, height:16, cursor:'pointer' }}/>
              <span style={{ width:100, fontSize:13, fontWeight:form.days[day]?.on?600:400, color:form.days[day]?.on?'var(--primary)':'var(--text2)' }}>
                {FULL[day]} {form.days[day]?.on ? `Total:${calcHrs(form.days[day].start,form.days[day].end)}` : ''}
              </span>
              {form.days[day]?.on && (<>
                <input type="time" className="form-input" style={{ width:130 }} value={form.days[day].start}
                  onChange={e=>setForm({...form,days:{...form.days,[day]:{...form.days[day],start:e.target.value}}})}/>
                <input type="time" className="form-input" style={{ width:130 }} value={form.days[day].end}
                  onChange={e=>setForm({...form,days:{...form.days,[day]:{...form.days[day],end:e.target.value}}})}/>
              </>)}
            </div>
          ))}
        </div>

        {/* User assignment */}
        <div className="card" style={{ flex:'1 1 260px', padding:20 }}>
          <div style={{ color:'var(--primary)', fontWeight:600, fontSize:13, marginBottom:12 }}>Assigned Calendar to Teams and Users</div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', marginBottom:10 }}>
            <input type="checkbox" onChange={e=>setSelEmps(e.target.checked?empList.map(x=>x.emp_email):[])} style={{ width:14, height:14 }}/>
            All Users
          </label>
          <input className="form-input" style={{ marginBottom:8 }} placeholder="Search users..." value={empSearch} onChange={e=>setEmpSearch(e.target.value)}/>
          <div style={{ maxHeight:220, overflowY:'auto', marginBottom:12 }}>
            {filteredEmps.map(e=>(
              <div key={e.emp_email} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <input type="checkbox" checked={selEmps.includes(e.emp_email)}
                  onChange={ev=>setSelEmps(ev.target.checked?[...selEmps,e.emp_email]:selEmps.filter(x=>x!==e.emp_email))}
                  style={{ width:14, height:14, cursor:'pointer' }}/>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>
                  {(e.emp_name||'U')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.emp_name}</div>
                  <div style={{ fontSize:10, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.emp_email}</div>
                </div>
              </div>
            ))}
          </div>
          {selEmps.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:'var(--primary)', fontWeight:600, marginBottom:6 }}>Selected ({selEmps.length})</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {selEmps.slice(0,6).map(email=>(
                  <span key={email} style={{ fontSize:11, background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:12, padding:'2px 8px', display:'flex', alignItems:'center', gap:4 }}>
                    {(empList.find(e=>e.emp_email===email)?.emp_name||email).split(' ')[0]}
                    <button onClick={()=>setSelEmps(selEmps.filter(x=>x!==email))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', fontSize:10, padding:0 }}>×</button>
                  </span>
                ))}
                {selEmps.length>6&&<span style={{ fontSize:11, color:'var(--text2)' }}>+{selEmps.length-6}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <Button onClick={save} disabled={saving} size="lg">{saving?'Saving...':'Save Shift'}</Button>
      </div>
    </div>
  );
};

export default CalendarSettings;
