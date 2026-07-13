import React, { useState } from 'react';
import useFetch from '../../../../hooks/useFetch';
import { dashboardService } from '../../../../services/dashboard.service';
import { fmt } from '../../../../utils/helpers';

const Top5Chart = ({ from, to, dept, title }) => {
  const [mode, setMode] = useState('distractive');
  const { data } = useFetch(
    () => dashboardService.getTopFive({ startDate:from, endDate:to, Department:dept, Title:title }),
    [from, to, dept, title]
  );
  const items = mode === 'productive' ? (data?.topProductive || []) : (data?.topDistracting || []);
  const total = items.reduce((s, a) => s + (a.totalMinutes || 0), 0);
  const color = mode === 'productive' ? '#3fb950' : '#f85149';

  return (
    <div className="card" style={{ flex:'1 1 480px' }}>
      <div className="card-header">
        <select className="form-input form-select" style={{ width:230, padding:'5px 10px' }}
          value={mode} onChange={e => setMode(e.target.value)}>
          <option value="productive">Top 5 productive activities</option>
          <option value="distractive">Top 5 distractive activities</option>
        </select>
        <span style={{ fontSize:13, fontWeight:600, color }}>
          Total: {fmt.mins(total)}
        </span>
      </div>
      <div className="card-body">
        {!items.length
          ? <div style={{ textAlign:'center', padding:'28px', color:'var(--text2)' }}>No data for range</div>
          : items.map((a, i) => {
            const pct = total > 0 ? Math.min(100, (a.totalMinutes / total) * 100) : 0;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                    <span style={{ fontSize:12, color:'var(--text2)', marginLeft:8, flexShrink:0 }}>{fmt.mins(a.totalMinutes || 0)}</span>
                  </div>
                  <div style={{ height:8, background:'var(--bg4)', borderRadius:4 }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4 }}/>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default Top5Chart;
