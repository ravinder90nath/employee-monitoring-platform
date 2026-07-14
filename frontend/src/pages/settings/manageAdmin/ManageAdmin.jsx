import React, { useState } from 'react';
import useFetch from '../../../hooks/useFetch';
import { authService } from '../../../services/auth.service';
import { Button, Badge, LoadingCenter, EmptyState, Select, Confirm, Alert } from '../../../components/common';
import { fmt } from '../../../utils/helpers';

const ManageAdmin = () => {
  const { data:users, loading, refetch } = useFetch(() => authService.getUserList(), []);
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({ email:'', role:'Admin' });
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open:false, message:'', onConfirm:null });
  const [alertMsg, setAlertMsg] = useState(null);

  const assign = async () => {
    if (!form.email.trim()) return;
    setSaving(true);
    try { await authService.assignRole(form.email, form.role); setModal(false); setForm({ email:'', role:'Admin' }); refetch(); }
    catch(e) { setAlertMsg('Failed: '+e.message); }
    setSaving(false);
  };

  const remove = async email => {
    setConfirm({ open:true, message:`Remove portal access for ${email}?`, onConfirm: async () => {
      try { await authService.deleteUser(email); refetch(); } catch(e) { setAlertMsg(e.message); }
    } });
  };

  const roleBadge = r => ({ SuperAdmin:'green', Admin:'blue', Staff:'gray' }[r] || 'gray');

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:15, fontWeight:600 }}>Manage Admin Users</div><div className="text-sm">Portal roles: SuperAdmin / Admin / Staff</div></div>
        <Button onClick={() => setModal(true)}>+ Add Admin</Button>
      </div>
      <div className="card">
        {loading ? <LoadingCenter/> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {!(users||[]).length ? <tr><td colSpan={6}><EmptyState title="No admin users"/></td></tr>
                  : (users||[]).map((u,i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{u.user_name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td><Badge variant={roleBadge(u.role)}>{u.role}</Badge></td>
                      <td className="text-sm">{u.last_login ? fmt.datetime(u.last_login) : 'Never'}</td>
                      <td><Badge variant={u.is_active?'green':'red'}>{u.is_active?'Active':'Inactive'}</Badge></td>
                      <td><Button size="sm" variant="danger" onClick={() => remove(u.email)}>Remove</Button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:10, padding:24, width:420 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Assign Portal Access</div>
            <div className="form-group">
              <label className="form-label">Employee Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="employee@company.com"/>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="SuperAdmin">SuperAdmin — Full access</option>
                <option value="Admin">Admin — Manage employees</option>
                <option value="Staff">Staff — View only</option>
              </select>
            </div>
            <div style={{ background:'var(--bg3)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--text2)', marginBottom:16 }}>
              ℹ️ Temp password: <strong style={{ color:'var(--text)' }}>Welcome@123</strong>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
              <Button onClick={assign} disabled={saving||!form.email}>{saving?'Assigning...':'Assign'}</Button>
            </div>
          </div>
        </div>
      )}
      <Confirm open={confirm.open} message={confirm.message} onClose={() => setConfirm({open:false})} onConfirm={confirm.onConfirm} />
      <Alert open={!!alertMsg} message={alertMsg||''} onClose={() => setAlertMsg(null)} />
    </div>
  );
};

export default ManageAdmin;
