import React, { useState, useEffect } from 'react';
import { authFetch } from '../../../../services/api';
import { Avatar } from '../../../../components/common';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AttendancePanel = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    authFetch(`${API_URL}/account/getstaffdetailsbyfilter`)
      .then(d => setEmployees(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = employees.filter(e =>
    !search || (e.empName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card" style={{ flex:'1 1 340px' }}>
      <div className="card-header">
        <div className="card-title">Daily Staff Attendance</div>
        <input className="form-input" style={{ width:150, padding:'4px 8px', fontSize:12 }}
          placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>
      <div style={{ maxHeight:300, overflowY:'auto' }}>
        {!filtered.length
          ? <div style={{ textAlign:'center', padding:24, color:'var(--text2)', fontSize:13 }}>No employees</div>
          : filtered.slice(0, 20).map((e, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
              <Avatar name={e.empName} size={30}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {e.empName} <span style={{ color:'var(--text2)', fontSize:11 }}>({e.shiftName?.split(' ')[0] || 'TM'})</span>
                </div>
                <div style={{ fontSize:11, color:'var(--text2)' }}>{e.empEmail}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'var(--text2)' }}>
                  {e.lastSignal && e.lastSignal !== 'Never' ? e.lastSignal.replace(' ago','') : 'Not logged in'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end', marginTop:2 }}>
                  <span className={`status-dot status-${e.status || 'offline'}`}/>
                  <span style={{ fontSize:11, textTransform:'capitalize', color: e.status==='online'?'var(--green)':e.status==='idle'?'var(--yellow)':'var(--text3)' }}>
                    {e.status === 'online' ? 'Online' : e.status === 'idle' ? 'Idle' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default AttendancePanel;
