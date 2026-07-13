import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useFetch from '../../../../hooks/useFetch';
import { dashboardService } from '../../../../services/dashboard.service';
import { fmt } from '../../../../utils/helpers';

const TIP = { background:'#1c2128', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, fontSize:11 };

const NetworkChart = ({ from, to }) => {
  const { data: network } = useFetch(() => dashboardService.getNetworkUsages({ startDate:from, endDate:to }), [from, to]);
  const nets = Array.isArray(network) ? network : [];

  const byDate = {};
  nets.forEach(n => {
    const d = n.log_date || from;
    if (!byDate[d]) byDate[d] = { date: d, download: 0, upload: 0 };
    byDate[d].download += (n.totalDownloadBytes || n.total_download_bytes || 0) / 1048576;
    byDate[d].upload   += (n.totalUploadBytes   || n.total_upload_bytes   || 0) / 1048576;
  });
  const chartData  = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  const totalDown  = nets.reduce((s, n) => s + (n.totalDownloadBytes || n.total_download_bytes || 0), 0);
  const totalUp    = nets.reduce((s, n) => s + (n.totalUploadBytes   || n.total_upload_bytes   || 0), 0);

  return (
    <div className="card" style={{ flex:'1 1 480px' }}>
      <div className="card-header">
        <div className="card-title">Daily Network Usage</div>
        <div style={{ display:'flex', gap:16, fontSize:12 }}>
          <span style={{ color:'var(--green)' }}>↓ {fmt.bytes(totalDown)}</span>
          <span style={{ color:'var(--red)' }}>↑ {fmt.bytes(totalUp)}</span>
        </div>
      </div>
      <div className="card-body">
        {!chartData.length
          ? <div style={{ textAlign:'center', padding:'32px', color:'var(--text2)' }}>No network data</div>
          : <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3fb950" stopOpacity={0.4}/><stop offset="95%" stopColor="#3fb950" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f85149" stopOpacity={0.4}/><stop offset="95%" stopColor="#f85149" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                <XAxis dataKey="date" tick={{ fill:'#7d8590', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(5)}/>
                <YAxis tick={{ fill:'#7d8590', fontSize:10 }} axisLine={false} tickLine={false} unit=" MB"/>
                <Tooltip contentStyle={TIP} formatter={(v, n) => [`${v.toFixed(1)} MB`, n]}/>
                <Legend wrapperStyle={{ fontSize:12 }}/>
                <Area type="monotone" dataKey="download" name="Download" stroke="#3fb950" strokeWidth={2} fill="url(#dg)"/>
                <Area type="monotone" dataKey="upload"   name="Upload"   stroke="#f85149" strokeWidth={2} fill="url(#ug)"/>
              </AreaChart>
            </ResponsiveContainer>
        }
      </div>
    </div>
  );
};

export default NetworkChart;
