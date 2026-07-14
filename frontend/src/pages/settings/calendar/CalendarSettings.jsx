import React, { useState, useEffect } from 'react';
import useFetch from '../../../hooks/useFetch';
import { settingsService } from '../../../services/settings.service';
import { authFetch } from '../../../services/api';
import { Button, EmptyState, Badge, LoadingCenter, Confirm, Alert } from '../../../components/common';

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
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [empList,     setEmpList]     = useState([]);
  const [selEmps,     setSelEmps]     = useState([]);
  const [empSearch,   setEmpSearch]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [confirm, setConfirm] = useState({ open:false, message:'', onConfirm:null });
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    authFetch(`${API_URL}/account/getemployeelist`)
      .then(d => setEmpList(Array.isArray(d) ? d : []));
  }, []);

  const openEdit = async s => {
    setSelected(s);
    // populate form days from stored day_times if available, otherwise fall back to shift start/end
    let days = defaultForm().days;
    try {
      if (s.day_times) {
        const dt = typeof s.day_times === 'string' ? JSON.parse(s.day_times) : s.day_times;
        days = { ...days, ...dt };
      } else {
        const start = s.start_time?.slice(0,5) || '09:30';
        const end   = s.end_time?.slice(0,5)   || '18:30';
        days = { Mon:{on:true,start,end}, Tue:{on:true,start,end}, Wed:{on:true,start,end},
          Thu:{on:true,start,end}, Fri:{on:true,start,end}, Sat:{on:s.working_days?.includes('Sat'),start,end}, Sun:{on:false,start:'09:00',end:'17:00'} };
      }
    } catch (ex) {
      const start = s.start_time?.slice(0,5) || '09:30';
      const end   = s.end_time?.slice(0,5)   || '18:30';
      days = { Mon:{on:true,start,end}, Tue:{on:true,start,end}, Wed:{on:true,start,end},
        Thu:{on:true,start,end}, Fri:{on:true,start,end}, Sat:{on:s.working_days?.includes('Sat'),start,end}, Sun:{on:false,start:'09:00',end:'17:00'} };
    }
    setForm({ name:s.name, country:s.country||'India', timezone:s.timezone||'IST', year: new Date().getFullYear().toString(), days });
    try {
      const resp = await settingsService.getShiftEmployees(s.id);
      const payload = resp?.data?.data ?? resp?.data ?? resp;
      setAssignedUsers(Array.isArray(payload) ? payload : []);
    } catch (e) {
      setAssignedUsers([]);
    }
  };

  const openNew = () => { setSelected(null); setForm(defaultForm()); setSelEmps([]); setAssignedUsers([]); };

  const calcHrs = (start, end) => {
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    const m = (eh*60+em)-(sh*60+sm);
    return m > 0 ? `${Math.floor(m/60)}hr` : '0hr';
  };

  const save = async () => {
    if (!form.name.trim()) return setAlertMsg('Shift name required');
    setSaving(true);
    try {
      const activeDays = Object.entries(form.days).filter(([,v]) => v.on);
      const first = activeDays[0];
      const payload = { name:form.name, country:form.country,
        working_days: activeDays.map(([d]) => d).join('-'),
        start_time: first ? first[1].start+':00' : '09:30:00',
        end_time:   first ? first[1].end+':00'   : '18:30:00',
        working_hours:9, is_default:false,
        day_times: JSON.stringify(form.days) };
      let shiftId;
      if (selected) { await settingsService.updateShift(selected.id, payload); shiftId = selected.id; }
      else { const r = await settingsService.createShift(payload); shiftId = r.data?.data?.id || r.data?.id; }
      if (selEmps.length) {
        for (const email of selEmps) await settingsService.assignShift(email, shiftId);
      }
      refetch(); openNew();
    } catch(e) { setAlertMsg('Save failed: '+e.message); }
    setSaving(false);
  };

  const assignSelected = async (shiftId) => {
    if (!selEmps.length) return setAlertMsg('Select at least one user first');
    const action = async () => {
      setSaving(true);
      try {
        for (const email of selEmps) await settingsService.assignShift(email, shiftId);
        setAlertMsg('Shift assigned to selected users');
        refetch();
      } catch (e) { setAlertMsg('Assignment failed: '+e.message); }
      setSaving(false);
    };

    if (selEmps.length > 1) {
      setConfirm({
        open: true,
        message: `Assign this shift to ${selEmps.length} selected users? This will overwrite their current shift assignments.`,
        onConfirm: action,
      });
      return;
    }

    action();
  };

  const assignAll = async (shiftId) => {
    setConfirm({
      open: true,
      message: 'Assign this shift to all active users? This will overwrite existing shift assignments for every user.',
      onConfirm: async () => {
        setSaving(true);
        try {
          const allEmails = empList.map(e => e.emp_email);
          for (const email of allEmails) await settingsService.assignShift(email, shiftId);
          setAlertMsg('Shift assigned to all users');
          refetch();
        } catch (e) { setAlertMsg('Assignment failed: '+e.message); }
        setSaving(false);
      },
    });
  };

  const del = async id => {
    setConfirm({ open:true, message:'Delete this shift?', onConfirm: async () => { try { await settingsService.deleteShift(id); refetch(); } catch(e) { setAlertMsg(e.message); } } });
  };

  const filteredEmps = empList.filter(e =>
    !empSearch || e.emp_name?.toLowerCase().includes(empSearch.toLowerCase()) || e.emp_email?.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <>
    <div>
      <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* Shift list */}
        <div style={{ minWidth:450 }}>
          <div style={{ fontWeight:600, marginBottom:10 }}>Shifts</div>
          {loading ? <LoadingCenter/> : (shifts||[]).map(s => (
            <div key={s.id} style={{ padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:selected?.id===s.id?'var(--primary-dim)':'var(--bg2)', marginBottom:8 }}>
              <div onClick={() => openEdit(s)} style={{ cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{s.name}</span>
                {!s.is_default && (
                  <button onClick={e=>{e.stopPropagation();del(s.id);}}
                    style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:16 }}>🗑</button>
                )}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text2)', marginTop:8 }}>
                <span>{(s.start_time||'09:30:00').slice(0,5)} - {(s.end_time||'18:30:00').slice(0,5)}</span>
                <span>{s.staff_count || 0} members</span>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button onClick={() => assignSelected(s.id)} disabled={!selEmps.length}
                  style={{ flex:1, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', borderRadius:6, padding:'8px 10px', cursor:selEmps.length?'pointer':'not-allowed' }}>
                  Assign selected
                </button>
                <button onClick={() => assignAll(s.id)}
                  style={{ flex:1, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', borderRadius:6, padding:'8px 10px', cursor:'pointer' }}>
                  Assign all
                </button>
              </div>
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
              <span style={{ width:200, fontSize:13, fontWeight:form.days[day]?.on?600:400, color:form.days[day]?.on?'var(--primary)':'var(--text2)' }}>
                {FULL[day]} {form.days[day]?.on ? `Total: ${calcHrs(form.days[day].start,form.days[day].end)}` : ''}
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
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:10, color:'var(--text2)' }}>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.emp_email}</span>
                    <span style={{ fontStyle:'italic', whiteSpace:'nowrap', marginRight:10 }}>{e.shift_name || 'Default Shift'}</span>
                  </div>
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
          {selected && assignedUsers.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginBottom:8 }}>Assigned Users</div>
              <div style={{ maxHeight:220, overflowY:'auto', border:'1px solid var(--border)', borderRadius:10, padding:10, background:'var(--bg3)' }}>
                {assignedUsers.map(u => (
                  <div key={u.emp_email} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600 }}>
                      {(u.emp_name||'U')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500 }}>{u.emp_name}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:10, color:'var(--text2)' }}>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.emp_email}</span>
                        <span style={{ fontStyle:'italic', whiteSpace:'nowrap' }}>{u.shift_name || 'Default Shift'}</span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setConfirm({ open:true, message:`Remove ${u.emp_name || u.emp_email} from this shift?`, onConfirm: async () => {
                          try {
                            await settingsService.unassignShiftEmployee(selected.id, u.emp_email);
                            const resp = await settingsService.getShiftEmployees(selected.id);
                            const payload = resp?.data?.data ?? resp?.data ?? resp;
                            setAssignedUsers(Array.isArray(payload) ? payload : []);
                          } catch (err) {
                            setAlertMsg('Could not remove user from shift');
                          }
                        } });
                      }}
                      style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:14, padding:2 }}
                      title="Remove user from this shift"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16, gap:12, flexWrap:'wrap' }}>
        {selected && <Button variant="secondary" onClick={() => assignSelected(selected.id)} disabled={!selEmps.length || saving} size="lg">Assign Selected</Button>}
        {selected && <Button variant="secondary" onClick={() => assignAll(selected.id)} disabled={saving} size="lg">Assign All</Button>}
        <Button onClick={save} disabled={saving} size="lg">{saving?'Saving...':'Save Shift'}</Button>
      </div>
    </div>
    <Confirm open={confirm.open} message={confirm.message} onClose={() => setConfirm({open:false})} onConfirm={confirm.onConfirm} />
    <Alert open={!!alertMsg} message={alertMsg||''} onClose={() => setAlertMsg(null)} />
    </>
  );
};

export default CalendarSettings;
