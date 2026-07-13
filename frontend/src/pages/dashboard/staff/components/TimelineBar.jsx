import React from 'react';
import { fmt } from '../../../../utils/helpers';

const TimelineBar = ({ apps = [], idleMins = 0 }) => {
  const productive  = apps.filter(a => a.category === 'productive').reduce((s, a) => s + (a.duration_minutes || 0), 0);
  const distractive = apps.filter(a => a.category === 'distractive').reduce((s, a) => s + (a.duration_minutes || 0), 0);
  const neutral     = apps.filter(a => a.category === 'neutral').reduce((s, a) => s + (a.duration_minutes || 0), 0);
  const total = productive + distractive + neutral + idleMins || 540;

  const segs = [
    { label:'Productive',  value:productive,  color:'#3fb950' },
    { label:'Neutral',     value:neutral,     color:'#2d8cf0' },
    { label:'Distracting', value:distractive, color:'#f85149' },
    { label:'No Activity', value:idleMins,    color:'#e3b341' },
  ].filter(s => s.value > 0);

  if (!segs.length) return (
    <div style={{ height:32, background:'var(--bg4)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'var(--text3)' }}>No activity data for this date</span>
    </div>
  );

  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', height:32, borderRadius:6, overflow:'hidden', background:'var(--bg4)' }}>
        {segs.map((s, i) => (
          <div key={i} title={`${s.label}: ${fmt.mins(s.value)}`}
            style={{ width:`${(s.value / total) * 100}%`, background:s.color, minWidth:2 }}/>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:'var(--text2)' }}>
        {['Work Start','','','','','Work End'].map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
};

export default TimelineBar;
