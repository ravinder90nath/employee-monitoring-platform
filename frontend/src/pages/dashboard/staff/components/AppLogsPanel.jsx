import React from 'react';
import { fmt } from '../../../../utils/helpers';

const AppLogsPanel = ({ aggregated = [] }) => {
  if (!aggregated || !aggregated.length) return <div style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>No app usage</div>;

  return (
    <div>
      <table className="table">
        <thead>
          <tr><th>App</th><th style={{ width:140 }}>Duration</th></tr>
        </thead>
        <tbody>
          {aggregated.map(a => (
            <tr key={a.app_name}>
              <td>{a.app_name}</td>
              <td style={{ textAlign:'right', color:'var(--text2)' }}>{fmt.mins(a.duration_minutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppLogsPanel;
