import React from 'react';
import { fmt } from '../../../../utils/helpers';

const WorkStatsRow = ({ sessions = [], idleMins = 0, networkUp = 0, networkDown = 0, shiftStart = '09:00:00', shiftEnd = '18:00:00', workingHours = 9, appLogs = [], idleLogs = [], date = null }) => {
  // Format shift times to HH:MM
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    if (typeof timeStr === 'string' && timeStr.includes(':')) {
      return timeStr.slice(0, 5);
    }
    return '--:--';
  };

  // Convert time string HH:MM to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === '--:--') return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Parse date helper
  const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  // Format time from Date object to HH:MM
  const formatTimeFromDate = (dateObj) => {
    if (!dateObj) return '--:--';
    const h = String(dateObj.getHours()).padStart(2, '0');
    const m = String(dateObj.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Calculate login/logout from appLogs and idleLogs (same as TimelineBar)
  const calculateActualTimes = () => {
    let firstTime = null;
    let lastTime = null;
    let totalWorkedMins = 0;

    // Get first and last times from appLogs
    if (appLogs && appLogs.length > 0) {
      const times = appLogs
        .map(log => {
          const end = parseDate(log.createdAt || log.created_at);
          const duration = parseFloat(log.durationInMinutes || log.duration_minutes || 0);
          if (!end || duration <= 0) return null;
          const start = new Date(end.getTime() - duration * 60000);
          return { start, end, duration };
        })
        .filter(t => t !== null);

      if (times.length > 0) {
        const sorted = times.sort((a, b) => a.start - b.start);
        firstTime = sorted[0].start;
        lastTime = times.reduce((max, t) => t.end > max ? t.end : max, sorted[0].end);
        totalWorkedMins = times.reduce((sum, t) => sum + t.duration, 0);
      }
    }

    // Get first and last times from idle logs if needed
    if (idleLogs && idleLogs.length > 0) {
      idleLogs.forEach(log => {
        const start = parseDate(log.idle_start);
        const end = parseDate(log.idle_end);
        if (start && end) {
          if (!firstTime || start < firstTime) firstTime = start;
          if (!lastTime || end > lastTime) lastTime = end;
        }
      });
    }

    return {
      loginTime: firstTime ? formatTimeFromDate(firstTime) : '--:--',
      logoutTime: lastTime ? formatTimeFromDate(lastTime) : '--:--',
      workedMins: totalWorkedMins
    };
  };

  const { loginTime, logoutTime, workedMins } = calculateActualTimes();
  const netMins = Math.max(0, workedMins - idleMins);

  // Calculate time difference in hr:min format
  const calculateTimeDifference = (expected, actual) => {
    const expMins = timeToMinutes(expected);
    const actMins = timeToMinutes(actual);
    
    if (expMins === null || actMins === null) return null;
    
    const diffMins = actMins - expMins;
    const sign = diffMins > 0 ? '+' : diffMins < 0 ? '-' : '';
    const absDiff = Math.abs(diffMins);
    const h = Math.floor(absDiff / 60);
    const m = absDiff % 60;
    
    return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Calculate work hours difference in hr:min format
  const calculateHoursDifference = (expected, actual) => {
    const expMins = Math.round(expected * 60);
    const actMins = Math.round(actual);
    const diffMins = expMins - actMins;
    
    if (diffMins === 0) return '00:00';
    
    const sign = diffMins > 0 ? '+' : '-';
    const absDiff = Math.abs(diffMins);
    const h = Math.floor(absDiff / 60);
    const m = absDiff % 60;
    
    return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const expectedStart = formatTime(shiftStart);
  const expectedEnd = formatTime(shiftEnd);
  const expectedWorkHours = Math.floor(workingHours) + 'h' + String((workingHours % 1) * 60).padStart(2, '0').substring(0, 2);

  // Calculate differences (null if data not available)
  const startDiff = loginTime !== '--:--' ? calculateTimeDifference(expectedStart, loginTime) : null;
  const endDiff = logoutTime !== '--:--' ? calculateTimeDifference(expectedEnd, logoutTime) : null;
  const hoursDiff = (appLogs && appLogs.length > 0) ? calculateHoursDifference(workingHours, netMins) : null;
  
  // Check if late
  const isLate = loginTime > expectedStart && loginTime !== '--:--';
  const isEarlyLogout = logoutTime !== '--:--' && logoutTime < expectedEnd;
  const isShortHours = netMins < (workingHours * 60);

  const StatRow = ({ label, expected, actual, difference, isWarning, hasData }) => (
    <tr>
      <td style={{ color: 'var(--text2)', paddingRight: 20, fontSize: 12, fontWeight: 500 }}>{label}</td>
      <td style={{ color: 'var(--text2)', fontSize: 12, paddingRight: 16 }}>{expected}</td>
      <td style={{ paddingRight: 16 }}>
        {hasData ? (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            color: actual === '--:--' ? 'var(--text2)' : isWarning ? 'var(--red)' : 'var(--green)',
            background: actual === '--:--' ? 'transparent' : isWarning ? 'var(--red-dim)' : 'var(--green-dim)',
          }}>{actual}</span>
        ) : (
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>-</span>
        )}
      </td>
      <td style={{ paddingLeft: 16, fontSize: 12, fontWeight: 600 }}>
        {difference ? (
          <span style={{
            color: difference === '00:00' ? 'var(--green)' : (difference.startsWith('+') ? 'var(--red)' : 'var(--orange)'),
          }}>
            {difference}
          </span>
        ) : (
          <span style={{ color: 'var(--text3)' }}>-</span>
        )}
      </td>
    </tr>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
          <thead>
            <tr>
              <td style={{ color: 'var(--text2)', paddingRight: 20, fontWeight: 500, fontSize: 11 }}></td>
              <td style={{ color: 'var(--text2)', fontWeight: 500, fontSize: 11, paddingRight: 16 }}>Expected</td>
              <td style={{ color: 'var(--text2)', fontWeight: 500, fontSize: 11, paddingRight: 16 }}>Actual</td>
              <td style={{ color: 'var(--text2)', fontWeight: 500, fontSize: 11, paddingLeft: 16 }}>Difference</td>
            </tr>
          </thead>
          <tbody>
            <StatRow label="Start Time" expected={expectedStart} actual={loginTime} difference={startDiff} isWarning={isLate} hasData={loginTime !== '--:--'} />
            <StatRow label="End Time" expected={expectedEnd} actual={logoutTime} difference={endDiff} isWarning={isEarlyLogout} hasData={logoutTime !== '--:--'} />
            <StatRow label="Work Hours" expected={expectedWorkHours} actual={fmt.hhmm(netMins)} difference={hoursDiff} isWarning={isShortHours} hasData={appLogs && appLogs.length > 0} />
          </tbody>
        </table>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 12 }}>
        {[['Download', '↓', 'var(--green)', networkDown], ['Upload', '↑', 'var(--red)', networkUp], ['Total', '⇅', 'var(--text2)', networkUp + networkDown]].map(([l, icon, c, val]) => (
          <div key={l} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)', minWidth: 60 }}>{l}</span>
            <span style={{ color: c }}>{icon}</span>
            <span style={{ fontWeight: 600 }}>{fmt.bytes(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkStatsRow;
