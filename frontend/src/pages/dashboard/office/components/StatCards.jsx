import React from 'react';

const CARDS = [
  { key:'totalUserCount',  label:'Total Users',  color:'blue',  icon:'👥' },
  { key:'activeUserCount', label:'Active Users', color:'green', icon:'✅' },
  { key:'totalIdleCount',  label:'Idle Users',   color:'orange',icon:'⏸' },
  { key:'longIdleCount',   label:'Long Idle',    color:'red',   icon:'⚠' },
];

const StatCards = ({ data }) => (
  <div className="grid-4 mb-4">
    {CARDS.map(c => (
      <div key={c.key} className={`stat-card ${c.color}`}>
        <div className="stat-icon">{c.icon}</div>
        <div className="stat-label">{c.label}</div>
        <div className={`stat-value ${c.color}`}>{data?.[c.key] ?? 0}</div>
      </div>
    ))}
  </div>
);

export default StatCards;
