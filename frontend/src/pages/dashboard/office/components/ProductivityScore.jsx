import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useFetch from '../../../../hooks/useFetch';
import { reportsService } from '../../../../services/reports.service';

const TIP = { background:'#1c2128', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, fontSize:11 };

const ProductivityScore = ({ from, to, dept, title }) => {
  const { data } = useFetch(
    () => reportsService.productivity({ startDate:from, endDate:to, department:dept, title }),
    [from, to, dept, title]
  );
  const rows = Array.isArray(data) ? data : [];
  const achieved    = rows.filter(r => { const t=(r.productive_minutes||0)+(r.distractive_minutes||0)+(r.neutral_minutes||0); return t>0&&(r.productive_minutes/t)>=0.5; }).length;
  const notAchieved = rows.length - achieved;
  const chartData   = rows.slice(0, 10).map(r => ({ name:(r.emp_name||'').split(' ')[0], hours: Math.round((r.productive_minutes||0)/60*100)/100 }));

  return (
    <div className="card" style={{ flex:'1 1 340px' }}>
      <div className="card-header"><div className="card-title">Daily Productivity Score</div></div>
      <div className="card-body">
        {!chartData.length
          ? <div style={{ textAlign:'center', padding:'28px', color:'var(--text2)' }}>No data</div>
          : <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ left:-10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill:'#7d8590', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#7d8590', fontSize:10 }} axisLine={false} tickLine={false} unit="h"/>
                <Tooltip contentStyle={TIP} formatter={v => [`${v}h`, 'Productive']}/>
                <Bar dataKey="hours" radius={[3,3,0,0]} barSize={18}>
                  {chartData.map((_, i) => <Cell key={i} fill="#2d8cf0"/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        }
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text2)', marginTop:8 }}>
          <span>Total: <strong style={{ color:'var(--text)' }}>{rows.length}</strong></span>
          <span>Achieved: <strong style={{ color:'var(--green)' }}>{achieved}</strong></span>
          <span>Not Achieved: <strong style={{ color:'var(--red)' }}>{notAchieved}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ProductivityScore;
