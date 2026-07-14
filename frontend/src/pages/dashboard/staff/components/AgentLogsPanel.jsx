import React, { useState, useEffect } from 'react';
import { adminService } from '../../../../services/admin.service';

const AgentLogsPanel = ({ from, to }) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    adminService.getAgentLogs(from, to).then(r => setLogs(r?.data || r || [])).catch(() => setLogs([]));
  }, [from, to]);

  if (!logs.length) return <div style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>No agent logs</div>;

  return (
    <div>
      <table className="table">
        <thead>
          <tr><th>Time</th><th>Type</th><th>Data</th></tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id}>
              <td style={{ color:'var(--text2)' }}>{(l.created_at||l.createdAt||'').replace('T',' ').split('.')[0]}</td>
              <td>{l.event_type}</td>
              <td style={{ color:'var(--text2)' }}>{l.event_data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentLogsPanel;
