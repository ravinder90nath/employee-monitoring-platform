import React from 'react';
import { fmt } from '../../../../utils/helpers';

const CAT_COLOR = { productive:'#3fb950', distractive:'#f85149', neutral:'#2d8cf0', idle:'#e3b341' };
const ICONS = { 'Google Chrome':'🌐','Microsoft Edge':'🌐','Visual Studio Code':'💙','Microsoft Visual Studio 2022':'💜','Microsoft Word':'📄','Microsoft Excel':'📊','Outlook':'📧','Slack':'💬','Microsoft Teams':'💼','Zoom':'📹','Figma':'🎨','Postman':'📮','Notepad':'📝','File Explorer':'📁','Windows Explorer':'📁','Photos':'🖼','Spotify':'🎵','Discord':'🎮' };

const AppBar = ({ app, maxMins, category }) => {
  const pct   = maxMins > 0 ? Math.min(100, (app.duration_minutes / maxMins) * 100) : 0;
  const color = CAT_COLOR[category] || '#7d8590';
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
        <span style={{ fontSize:14 }}>{ICONS[app.app_name] || '📦'}</span>
        <span style={{ fontSize:12, fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.app_name}</span>
        <span style={{ fontSize:11, color:'var(--text2)' }}>{fmt.mins(app.duration_minutes)}</span>
        <span style={{ fontSize:12 }}>{category === 'productive' ? '👍' : category === 'distractive' ? '👎' : '✋'}</span>
      </div>
      <div style={{ height:6, background:'var(--bg4)', borderRadius:3 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3 }}/>
      </div>
    </div>
  );
};

const Panel = ({ title, items, category, color, total }) => (
  <div style={{ flex:1, background:'var(--bg3)', borderRadius:10, padding:'14px 16px', border:`1px solid ${color}22` }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
      <span style={{ fontWeight:600, fontSize:13 }}>{title}</span>
      <span style={{ fontSize:11, fontWeight:700, color, background:`${color}22`, padding:'2px 8px', borderRadius:4 }}>{fmt.mins(total)}</span>
    </div>
    {!items.length
      ? <div style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:'20px 0' }}>No data</div>
      : items.slice(0, 6).map((a, i) => (
          <AppBar key={i} app={a} maxMins={Math.max(...items.map(x => x.duration_minutes), 1)} category={category}/>
        ))
    }
  </div>
);

const ActivitiesPanel = ({ apps = [], idleMins = 0 }) => {
  const productive  = apps.filter(a => a.category === 'productive');
  const distractive = apps.filter(a => a.category === 'distractive');
  const totalP = productive.reduce((s, a) => s + (a.duration_minutes || 0), 0);
  const totalD = distractive.reduce((s, a) => s + (a.duration_minutes || 0), 0);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:8 }}>
      <Panel title="Productive"  items={productive}  category="productive"  color="#3fb950" total={totalP}/>
      <Panel title="Distracting" items={distractive} category="distractive" color="#f85149" total={totalD}/>
      <div style={{ flex:1, background:'var(--bg3)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(227,179,65,.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontWeight:600, fontSize:13 }}>No Activity</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#e3b341', background:'rgba(227,179,65,.15)', padding:'2px 8px', borderRadius:4 }}>{fmt.mins(idleMins)}</span>
        </div>
        {idleMins > 0 ? (
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <span>💤</span>
              <span style={{ fontSize:12, fontWeight:500, flex:1 }}>Idle Time</span>
              <span style={{ fontSize:11, color:'var(--text2)' }}>{fmt.mins(idleMins)}</span>
            </div>
            <div style={{ height:6, background:'var(--bg4)', borderRadius:3 }}>
              <div style={{ width:'100%', height:'100%', background:'#e3b341', borderRadius:3 }}/>
            </div>
          </div>
        ) : <div style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:'20px 0' }}>No idle recorded</div>}
      </div>
    </div>
  );
};

export default ActivitiesPanel;
