import React from 'react';
import { fmt } from '../../../../utils/helpers';

const CATEGORY_COLOR = {
  productive: '#3fb950',
  distractive: '#f85149',
  neutral: '#2d8cf0',
  idle: '#e3b341',
};

const parseDate = value => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const buildSegments = ({ appLogs = [], idleLogs = [] }) => {
  const segments = [];

  appLogs.forEach(item => {
    const end = parseDate(item.createdAt || item.created_at);
    const duration = parseFloat(item.durationInMinutes || item.duration_minutes || 0);
    if (!end || duration <= 0) return;
    const start = new Date(end.getTime() - duration * 60000);
    segments.push({
      start,
      end,
      label: item.appName || item.app_name || 'App',
      color: CATEGORY_COLOR[item.category] || CATEGORY_COLOR.neutral,
      type: item.category || 'neutral',
    });
  });

  idleLogs.forEach(item => {
    const start = parseDate(item.idle_start);
    const end = parseDate(item.idle_end);
    const duration = parseFloat(item.duration_minutes || item.durationInMinutes || 0);
    if (!start || !end || duration <= 0) return;
    segments.push({
      start,
      end,
      label: 'Idle',
      color: CATEGORY_COLOR.idle,
      type: 'idle',
    });
  });

  return segments.sort((a, b) => a.start - b.start);
};

const normalizeRange = (dateBase, shiftStart, shiftEnd, segments) => {
  const dayStart = new Date(dateBase);
  dayStart.setHours(9, 0, 0, 0);
  const dayEnd = new Date(dateBase);
  dayEnd.setHours(18, 0, 0, 0);

  let start = dayStart;
  let end = dayEnd;
  if (shiftStart) {
    const [sh, sm] = shiftStart.split(':').map(Number);
    if (!Number.isNaN(sh) && !Number.isNaN(sm)) {
      const ss = new Date(dateBase);
      ss.setHours(sh, sm, 0, 0);
      start = ss;
    }
  }
  if (shiftEnd) {
    const [eh, em] = shiftEnd.split(':').map(Number);
    if (!Number.isNaN(eh) && !Number.isNaN(em)) {
      const ee = new Date(dateBase);
      ee.setHours(eh, em, 0, 0);
      end = ee;
    }
  }

  if (segments.length) {
    const minStart = new Date(Math.min(...segments.map(s => s.start.getTime())));
    const maxEnd = new Date(Math.max(...segments.map(s => s.end.getTime())));
    if (minStart < start) start = minStart;
    if (maxEnd > end) end = maxEnd;
  }
  if (end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
};

const TimelineBar = ({ appLogs = [], idleLogs = [], sessions = [], shiftStart, shiftEnd, date }) => {
  const segments = buildSegments({ appLogs, idleLogs });
  const dateBase = date ? new Date(`${date}T00:00:00`) : new Date();
  const range = normalizeRange(dateBase, shiftStart, shiftEnd, segments);
  const totalMinutes = Math.max(1, (range.end.getTime() - range.start.getTime()) / 60000);

  if (!segments.length) return (
    <div style={{ height:32, background:'var(--bg4)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'var(--text3)' }}>No activity data for this date</span>
    </div>
  );

  const ticks = [range.start, new Date((range.start.getTime() + range.end.getTime()) / 2), range.end];

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ position:'relative', height:32, borderRadius:8, overflow:'hidden', background:'var(--bg4)', border:'1px solid var(--border)' }}>
        {segments.map((seg, idx) => {
          const left = ((seg.start.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())) * 100;
          const width = ((seg.end.getTime() - seg.start.getTime()) / (range.end.getTime() - range.start.getTime())) * 100;
          return (
            <div key={idx} title={`${seg.label} • ${fmt.time(seg.start)} - ${fmt.time(seg.end)}`}
              style={{ position:'absolute', left:`${left}%`, width:`${width}%`, top:0, bottom:0, background:seg.color, minWidth:1 }}/>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'var(--text2)' }}>
        {ticks.map((tick, idx) => (
          <span key={idx} style={{ minWidth:0, textAlign: idx === 1 ? 'center' : idx === 2 ? 'right' : 'left', flex: 1 }}>
            {fmt.time(tick)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TimelineBar;
