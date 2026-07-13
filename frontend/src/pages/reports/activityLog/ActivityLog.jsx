import React, { useState } from 'react';
import useFetch from '../../../hooks/useFetch';
import useDeptTitles from '../../../hooks/useDeptTitles';
import { reportsService } from '../../../services/reports.service';
import { LoadingCenter, EmptyState, Badge, ProgressBar } from '../../../components/common';
import { today, weekAgo, fmt, scoreColor } from '../../../utils/helpers';

const ActivityLog = () => {
  const [from,  setFrom]  = useState(weekAgo());
  const [to,    setTo]    = useState(today());
  const [dept,  setDept]  = useState('');
  const [title, setTitle] = useState('');
  const { deptTitles } = useDeptTitles();
  const titles = deptTitles.find(d => d.department === dept)?.titles || [];

  const { data, loading } = useFetch(
    () => reportsService.activityLog({ startDate:from, endDate:to, department:dept, title }),
    [from, to, dept, title]
  );
  const rows = Array.isArray(data) ? data : [];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div className="date-filter"><input type="date" value={from} onChange={e => setFrom(e.target.value)}/></div>
        <span className="text-sm">to</span>
        <div className="date-filter"><input type="date" value={to}   onChange={e => setTo(e.target.value)}/></div>
        <select className="form-input form-select" style={{ width:160 }} value={dept} onChange={e=>{setDept(e.target.value);setTitle('');}}>
          <option value="">All Departments</option>
          {deptTitles.map(d=><option key={d.department} value={d.department}>{d.department}</option>)}
        </select>
        <select className="form-input form-select" style={{ width:120 }} value={title} onChange={e=>setTitle(e.target.value)}>
          <option value="">All Titles</option>
          {titles.map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm ml-auto">⬇ Export CSV</button>
      </div>
      <div className="card">
        {loading ? <LoadingCenter/> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Required</th><th>Worked</th><th>Idle</th><th>Net Active</th><th>Progress</th><th>Status</th></tr></thead>
              <tbody>
                {!rows.length
                  ? <tr><td colSpan={7}><EmptyState title="No data for selected range"/></td></tr>
                  : rows.map((r, i) => {
                    const pct = Math.min(100, fmt.pct(r.netWorkingHours||0, r.totalExpectedHours||9));
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight:500 }}>{r.empName || r.empEmail}</td>
                        <td>{r.totalExpectedHours||9}h</td>
                        <td>{(r.totalWorkedHours||0).toFixed(1)}h</td>
                        <td style={{ color:'var(--yellow)' }}>{(r.totalIdleHours||0).toFixed(1)}h</td>
                        <td style={{ color:scoreColor(pct) }}>{(r.netWorkingHours||0).toFixed(1)}h</td>
                        <td style={{ minWidth:110 }}>
                          <ProgressBar value={pct} color={scoreColor(pct)} height={5}/>
                          <span style={{ fontSize:10, color:'var(--text2)' }}>{pct}%</span>
                        </td>
                        <td>{r.overAchiever?<Badge variant="green">Over Achiever</Badge>:r.achievedTarget?<Badge variant="blue">On Track</Badge>:<Badge variant="red">Below Target</Badge>}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
