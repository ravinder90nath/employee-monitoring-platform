import React, { useState } from 'react';
import useFetch from '../../../hooks/useFetch';
import { settingsService } from '../../../services/settings.service';
import { Badge, LoadingCenter, EmptyState } from '../../../components/common';
import { fmt } from '../../../utils/helpers';

const ManageProductivity = () => {
  const [distrSearch, setDistrSearch] = useState('');
  const [prodSearch,  setProdSearch]  = useState('');
  const [selDistr,    setSelDistr]    = useState([]);
  const [selProd,     setSelProd]     = useState([]);
  const [addModal,    setAddModal]    = useState(false);
  const [addForm,     setAddForm]     = useState({ name:'', type:'Website', category:'productive' });
  const [saving,      setSaving]      = useState(false);

  const { data:allApps, loading, refetch } = useFetch(() => settingsService.getApps({}), []);
  const distracting = (allApps||[]).filter(a => a.category === 'distractive');
  const productive  = (allApps||[]).filter(a => a.category === 'productive');
  const filtDistr   = distracting.filter(a => !distrSearch || a.name.toLowerCase().includes(distrSearch.toLowerCase()));
  const filtProd    = productive.filter(a  => !prodSearch  || a.name.toLowerCase().includes(prodSearch.toLowerCase()));

  const markAs = async (ids, category) => {
    for (const id of ids) await settingsService.updateAppCat(id, category);
    setSelDistr([]); setSelProd([]); refetch();
  };

  const addRule = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    await settingsService.addApp({ name:addForm.name, type:addForm.type==='Website'?'Url':'App', category:addForm.category });
    setAddModal(false); setAddForm({ name:'', type:'Website', category:'productive' }); refetch();
    setSaving(false);
  };

  const fmtSeen = mins => {
    if (!mins || mins <= 0) return 'Never Used';
    const d = Math.floor(mins/1440), h = Math.floor((mins%1440)/60);
    return `${d}d ${h}h`;
  };

  const maxDistr = Math.max(...distracting.map(x=>x.total_minutes), 1);
  const maxProd  = Math.max(...productive.map(x=>x.total_minutes), 1);

  const AppRow = ({ a, selected, setSelected, maxM, isChecked }) => {
    const pct = a.total_minutes > 0 ? Math.min(100,(a.total_minutes/maxM)*100) : 0;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
        <input type="checkbox" checked={selected.includes(a.id)}
          onChange={e => setSelected(e.target.checked ? [...selected,a.id] : selected.filter(x=>x!==a.id))}
          style={{ width:14, height:14, cursor:'pointer' }}/>
        <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>🌐</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
          <div style={{ height:4, background:'var(--bg4)', borderRadius:2, marginTop:3 }}>
            <div style={{ width:`${pct}%`, height:'100%', background: isChecked?'#3fb950':'#f85149', borderRadius:2 }}/>
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--text2)', width:70, textAlign:'right' }}>{fmtSeen(a.total_minutes)}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Distracting */}
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontWeight:600, fontSize:14, flex:1 }}>Distracting Activities</div>
            <input className="form-input" style={{ width:150, fontSize:12 }} placeholder="Search..." value={distrSearch} onChange={e=>setDistrSearch(e.target.value)}/>
            <button onClick={()=>setAddModal(true)} style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}>Add New</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', maxHeight:400 }}>
            {loading ? <LoadingCenter/> : !filtDistr.length ? <EmptyState title="No distracting activities"/>
              : filtDistr.map(a => <AppRow key={a.id} a={a} selected={selDistr} setSelected={setSelDistr} maxM={maxDistr} isChecked={false}/>)}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <button onClick={()=>markAs(selDistr,'productive')} style={{ border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12 }}>
              Mark As Productive ({selDistr.length})
            </button>
          </div>
        </div>

        {/* Productive */}
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontWeight:600, fontSize:14, flex:1 }}>Productive Activities</div>
            <input className="form-input" style={{ width:150, fontSize:12 }} placeholder="Search..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
          </div>
          <div style={{ flex:1, overflowY:'auto', maxHeight:400 }}>
            {loading ? <LoadingCenter/> : !filtProd.length ? <EmptyState title="No productive activities"/>
              : filtProd.map(a => <AppRow key={a.id} a={a} selected={selProd} setSelected={setSelProd} maxM={maxProd} isChecked={true}/>)}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <button onClick={()=>markAs(selProd,'distractive')} style={{ border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12 }}>
              Mark As Distractive ({selProd.length})
            </button>
          </div>
        </div>
      </div>

      {addModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:10, padding:24, width:480 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:16 }}>Add New Rule</div>
              <button onClick={()=>setAddModal(false)} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'end', marginBottom:20 }}>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Websites/App Type</label>
                <select className="form-input form-select" value={addForm.type} onChange={e=>setAddForm({...addForm,type:e.target.value})}>
                  <option value="Website">Website</option><option value="App">Application</option>
                </select>
              </div>
              <div style={{ paddingBottom:8, color:'var(--text2)', fontSize:13 }}>Equal to</div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">URL / Name</label>
                <input className="form-input" value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} placeholder="example.com"/>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, alignItems:'center' }}>
              <select className="form-input form-select" style={{ width:140 }} value={addForm.category} onChange={e=>setAddForm({...addForm,category:e.target.value})}>
                <option value="productive">Productive</option><option value="distractive">Distractive</option><option value="neutral">Neutral</option>
              </select>
              <button onClick={addRule} disabled={saving||!addForm.name}
                style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:6, padding:'8px 20px', fontSize:13, cursor:'pointer', fontWeight:600 }}>
                {saving?'Adding...':'Add New Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProductivity;
