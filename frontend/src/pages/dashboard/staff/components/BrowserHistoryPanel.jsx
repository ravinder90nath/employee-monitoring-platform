import React from 'react';

const BrowserHistoryPanel = ({ rows }) => {
  if (!rows || !rows.length) return (
    <div style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>No browser activity for selected date</div>
  );

  return (
    <div>
      <table className="table" style={{ width:'100%' }}>
        <thead>
          <tr>
            <th style={{ width:140 }}>Time</th>
            <th>URL</th>
            <th style={{ width:160 }}>Domain</th>
            <th style={{ width:120 }}>Duration (min)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={{ color:'var(--text2)', fontSize:13 }}>{(r.created_at||r.createdAt||r.createdAt)?.replace('T',' ').split('.')[0]}</td>
              <td><a href={r.url} target="_blank" rel="noreferrer">{r.url}</a></td>
              <td style={{ color:'var(--text2)' }}>{r.domain}</td>
              <td style={{ textAlign:'right' }}>{parseFloat(r.duration_minutes||r.durationInMinutes||0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BrowserHistoryPanel;
