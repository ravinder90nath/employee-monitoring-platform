import React from 'react';
import { avatarBg, initials } from '../../utils/helpers';

export const Avatar = ({ name='', size=34, src }) => {
  const bg = avatarBg(name);
  return (
    <div style={{width:size,height:size,minWidth:size,borderRadius:'50%',background:src?'transparent':`${bg}22`,color:bg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*0.36,overflow:'hidden',flexShrink:0}}>
      {src?<img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>:initials(name)}
    </div>
  );
};

export const Badge = ({ children, variant='gray', dot=false, style={} }) => (
  <span className={`badge badge-${variant}`} style={style}>
    {dot&&<span className="badge-dot"/>}{children}
  </span>
);

export const Card = ({ children, className='', style={} }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

export const Spinner = ({ size='md' }) => <div className={`spinner ${size==='lg'?'spinner-lg':''}`}/>;

export const LoadingCenter = ({ msg='Loading...' }) => (
  <div className="loading-center"><Spinner size="lg"/><span>{msg}</span></div>
);

export const EmptyState = ({ icon='📭', title='No data', sub='' }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <div className="empty-title">{title}</div>
    {sub&&<div className="empty-sub">{sub}</div>}
  </div>
);

export const Button = ({ children, variant='primary', size='md', className='', ...rest }) => (
  <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>{children}</button>
);

export const Modal = ({ open, onClose, title, children, footer, maxWidth=520 }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose?.()}>
      <div className="modal fade-in" style={{maxWidth}}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer&&<div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const Input = ({ label, error, ...props }) => (
  <div className="form-group">
    {label&&<label className="form-label">{label}</label>}
    <input className="form-input" {...props}/>
    {error&&<div className="form-error">{error}</div>}
  </div>
);

export const Select = ({ label, children, ...props }) => (
  <div className="form-group">
    {label&&<label className="form-label">{label}</label>}
    <select className="form-input form-select" {...props}>{children}</select>
  </div>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map(t=><button key={t.id} className={`tab ${active===t.id?'active':''}`} onClick={()=>onChange(t.id)}>{t.label}</button>)}
  </div>
);

export const ProgressBar = ({ value=0, color='var(--primary)', height=6 }) => (
  <div className="progress-bar" style={{height}}>
    <div className="progress-fill" style={{width:`${Math.min(100,Math.max(0,value))}%`,background:color,height:'100%'}}/>
  </div>
);

export const StatusDot = ({ status='offline' }) => (
  <span className={`status-dot status-${status}`}/>
);

export const Toggle = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-2">
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)}/>
      <span className="toggle-slider"/>
    </label>
    {label&&<span className="text-sm">{label}</span>}
  </div>
);

export const DateRangePicker = ({ from, to, onFromChange, onToChange }) => (
  <div className="flex items-center gap-2">
    <div className="date-filter"><input type="date" value={from} onChange={e=>onFromChange(e.target.value)}/></div>
    <span className="text-sm">to</span>
    <div className="date-filter"><input type="date" value={to} onChange={e=>onToChange(e.target.value)}/></div>
  </div>
);

export const DeptTitleFilter = ({ deptTitles=[], dept, title, onDeptChange, onTitleChange }) => {
  const titles = (deptTitles.find(d=>d.department===dept)?.titles||[]);
  return (
    <div className="flex items-center gap-2">
      <select className="form-input form-select" style={{width:160}} value={dept} onChange={e=>{onDeptChange(e.target.value);onTitleChange('');}}>
        <option value="">All Departments</option>
        {deptTitles.map(d=><option key={d.department} value={d.department}>{d.department}</option>)}
      </select>
      <select className="form-input form-select" style={{width:120}} value={title} onChange={e=>onTitleChange(e.target.value)}>
        <option value="">All Titles</option>
        {titles.map(t=><option key={t.title} value={t.title}>{t.title}</option>)}
      </select>
    </div>
  );
};

export const Table = ({ columns=[], data=[], onRowClick, emptyMsg='No data' }) => (
  <div className="table-wrap">
    <table>
      <thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead>
      <tbody>
        {!data?.length
          ? <tr><td colSpan={columns.length}><EmptyState title={emptyMsg}/></td></tr>
          : data.map((row,i)=>(
            <tr key={row.id||i} onClick={()=>onRowClick?.(row)} style={onRowClick?{cursor:'pointer'}:{}}>
              {columns.map(c=><td key={c.key}>{c.render?c.render(row[c.key],row):row[c.key]}</td>)}
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

export const Confirm = ({ open, title='Confirm', message, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose?.()}>
      <div className="modal fade-in" style={{maxWidth:520}}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize:14 }}>{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { onConfirm?.(); onClose?.(); }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export const Alert = ({ open, title='Alert', message, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose?.()}>
      <div className="modal fade-in" style={{maxWidth:520}}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize:14 }}>{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};
