import React, { useState } from 'react';
import useFetch from '../../../hooks/useFetch';
import useDeptTitles from '../../../hooks/useDeptTitles';
import { reportsService } from '../../../services/reports.service';
import { LoadingCenter, EmptyState, Badge } from '../../../components/common';
import { today } from '../../../utils/helpers';

const WorkingHoursCompliance = () => {
  const [date,  setDate]  = useState(today());
  const [dept,  setDept]  = useState('');
  const [title, setTitle] = useState('');
  const { deptTitles } = useDeptTitles();
  const titles = deptTitles.find(d => d.department === dept)?.titles || [];

  const { data, loading } = useFetch(
    () => reportsService.workingCompliance({ date, department:dept, title }),
    [date, dept, title]
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div className="date-filter"><input type="date" value={date} onChange={e => setDate(e.target.value)}/></div>
        <select className="form-input form-select" style={{ width:160 }} value={dept} onChange={e=>{setDept(e.target.value);setTitle('');}}>
          <option value="">All Departments</option>
          {deptTitles.map(d=><option key={d.department} value={d.department}>{d.department}</option>)}
        </select>
        <select className="form-input form-select" style={{ width:120 }} value={title} onChange={e=>setTitle(e.target.value)}>
          <option value="">All Titles</option>
          {titles.map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm ml-auto">⬇ Export</button>
      </div>
      {data && (
        <div className="grid-4 mb-4">
          {[
            {label:'Total Employees',    value:data.totalEmployees||0,    color:'blue'},
            {label:'Late Arrivals',       value:data.lateArrivals||0,      color:'red'},
            {label:'Early Departures',    value:data.earlyDepartures||0,   color:'orange'},
            {label:'Compliant',           value:data.compliantEmployees||0, color:'green'},
          ].map(s=>(
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        {loading ? <LoadingCenter/> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Login</th><th>Logout</th><th>Shift Start</th><th>Shift End</th><th>Late</th><th>Early Leave</th></tr></thead>
              <tbody>
                {!(data?.records||[]).length
                  ? <tr><td colSpan={7}><EmptyState title="No records for this date"/></td></tr>
                  : data.records.map((r,i)=>(
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{r.emp_name||r.emp_email}</td>
                      <td style={{ color:r.isLate?'var(--red)':'var(--green)' }}>{r.loginTime||'—'}</td>
                      <td style={{ color:r.isEarlyLeave?'var(--red)':'inherit' }}>{r.logoutTime||'—'}</td>
                      <td className="text-muted">{r.shiftStart}</td>
                      <td className="text-muted">{r.shiftEnd}</td>
                      <td>{r.isLate?<Badge variant="red">Late</Badge>:<Badge variant="green">On Time</Badge>}</td>
                      <td>{r.isEarlyLeave?<Badge variant="orange">Early Leave</Badge>:<Badge variant="gray">Normal</Badge>}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingHoursCompliance;
