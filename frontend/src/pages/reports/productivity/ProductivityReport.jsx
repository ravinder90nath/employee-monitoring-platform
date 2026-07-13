import React, { useState } from 'react';
import useFetch from '../../../hooks/useFetch';
import useDeptTitles from '../../../hooks/useDeptTitles';
import { reportsService } from '../../../services/reports.service';
import { Avatar, LoadingCenter, EmptyState, ProgressBar } from '../../../components/common';
import { today, weekAgo, fmt, scoreColor } from '../../../utils/helpers';

const ProductivityReport = () => {
  const [from,  setFrom]  = useState(weekAgo());
  const [to,    setTo]    = useState(today());
  const [dept,  setDept]  = useState('');
  const [title, setTitle] = useState('');
  const { deptTitles } = useDeptTitles();
  const titles = deptTitles.find(d => d.department === dept)?.titles || [];

  const { data, loading } = useFetch(
    () => reportsService.productivity({ startDate:from, endDate:to, department:dept, title }),
    [from, to, dept, title]
  );
  const rows = Array.isArray(data) ? data : [];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div className="date-filter"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <span className="text-sm">to</span>
        <div className="date-filter"><input type="date" value={to}   onChange={e=>setTo(e.target.value)}/></div>
        <select className="form-input form-select" style={{ width:160 }} value={dept} onChange={e=>{setDept(e.target.value);setTitle('');}}>
          <option value="">All Departments</option>
          {deptTitles.map(d=><option key={d.department} value={d.department}>{d.department}</option>)}
        </select>
        <select className="form-input form-select" style={{ width:120 }} value={title} onChange={e=>setTitle(e.target.value)}>
          <option value="">All Titles</option>
          {titles.map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm ml-auto">⬇ Download</button>
      </div>
      <div className="card">
        {loading ? <LoadingCenter/> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Dept</th><th>Title</th><th>Productive</th><th>Distractive</th><th>Neutral</th><th>Idle</th><th>Score</th></tr></thead>
              <tbody>
                {!rows.length
                  ? <tr><td colSpan={8}><EmptyState title="No productivity data"/></td></tr>
                  : rows.map((r,i)=>{
                    const total = (r.productive_minutes||0)+(r.distractive_minutes||0)+(r.neutral_minutes||0);
                    const score = total>0 ? Math.round((r.productive_minutes/total)*100) : 0;
                    return (
                      <tr key={i}>
                        <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={r.emp_name} size={28}/><span style={{ fontWeight:500 }}>{r.emp_name}</span></div></td>
                        <td className="text-muted">{r.department||'—'}</td>
                        <td className="text-muted">{r.title||'—'}</td>
                        <td style={{ color:'var(--green)' }}>{fmt.mins(r.productive_minutes)}</td>
                        <td style={{ color:'var(--red)' }}>{fmt.mins(r.distractive_minutes)}</td>
                        <td style={{ color:'var(--primary)' }}>{fmt.mins(r.neutral_minutes)}</td>
                        <td style={{ color:'var(--yellow)' }}>{fmt.mins(r.idle_minutes)}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:100 }}>
                            <span style={{ color:scoreColor(score), fontWeight:700, minWidth:32 }}>{score}%</span>
                            <ProgressBar value={score} color={scoreColor(score)} height={4}/>
                          </div>
                        </td>
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

export default ProductivityReport;
