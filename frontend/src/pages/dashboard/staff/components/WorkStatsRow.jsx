import React from 'react';
import { fmt } from '../../../../utils/helpers';

const WorkStatsRow = ({ sessions = [], idleMins = 0, networkUp = 0, networkDown = 0 }) => {
  const loginTime  = sessions[0]?.session_start ? new Date(sessions[0].session_start).toTimeString().slice(0,5) : '--:--';
  const logoutTime = sessions[sessions.length-1]?.session_end ? new Date(sessions[sessions.length-1].session_end).toTimeString().slice(0,5) : '--:--';
  const workedMins = sessions.reduce((s, sess) => {
    if (!sess.session_start) return s;
    const end = sess.session_end ? new Date(sess.session_end) : new Date();
    return s + (end - new Date(sess.session_start)) / 60000;
  }, 0);
  const netMins = Math.max(0, workedMins - idleMins);
  const isLate  = loginTime > '09:30' && loginTime !== '--:--';

  const StatRow = ({ label, expected, actual, isRed }) => (
    <tr>
      <td style={{ color:'var(--text2)', paddingRight:20, fontSize:12 }}>{label}</td>
      <td style={{ color:'var(--text2)', fontSize:12, paddingRight:16 }}>{expected}</td>
      <td>
        <span style={{
          fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:4,
          color: actual === '--:--' ? 'var(--text2)' : isRed ? 'var(--red)' : 'var(--green)',
          background: actual === '--:--' ? 'transparent' : isRed ? 'var(--red-dim)' : 'var(--green-dim)',
        }}>{actual}</span>
      </td>
    </tr>
  );

  return (
    <div style={{ display:'flex', alignItems:'center', gap:40, padding:'12px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:16, flexWrap:'wrap' }}>
      <table style={{ borderCollapse:'separate', borderSpacing:'0 4px' }}>
        <thead>
          <tr>
            <td style={{ color:'var(--text2)', paddingRight:20, fontWeight:500, fontSize:11 }}>Expected</td>
            <td style={{ color:'var(--text2)', fontWeight:500, fontSize:11 }}>Actual</td>
          </tr>
        </thead>
        <tbody>
          <StatRow label="Start Time"  expected="09:30" actual={loginTime}        isRed={isLate} />
          <StatRow label="End Time"    expected="23:30" actual={logoutTime}       isRed={false} />
          <StatRow label="Work Hours"  expected="09:00" actual={fmt.hhmm(netMins)} isRed={netMins < 480} />
        </tbody>
      </table>
      <div style={{ marginLeft:'auto', fontSize:12 }}>
        {[['Download','↓','var(--green)',networkDown],['Upload','↑','var(--red)',networkUp],['Total','⇅','var(--text2)',networkUp+networkDown]].map(([l,icon,c,val])=>(
          <div key={l} style={{ display:'flex', gap:10, marginBottom:4 }}>
            <span style={{ color:'var(--text2)', minWidth:60 }}>{l}</span>
            <span style={{ color:c }}>{icon}</span>
            <span style={{ fontWeight:600 }}>{fmt.bytes(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkStatsRow;
