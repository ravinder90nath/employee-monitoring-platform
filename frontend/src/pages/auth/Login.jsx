import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email,    setEmail]    = useState('admin@ems.com');
  const [password, setPassword] = useState('Admin@1234');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch(err) { setError(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid"/>
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="login-brand-name">EMS<span>INTL</span></div>
            <div className="login-brand-sub">Employee Monitoring System</div>
          </div>
        </div>
        <h1 className="login-title">Sign in to your account</h1>
        <p className="login-desc">Monitor, analyze and improve workforce productivity</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@company.com"/>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width:16, height:16 }}/> : '→ Sign in'}
          </button>
        </form>
        <div className="login-demo"><strong>Demo:</strong> admin@ems.com / Admin@1234</div>
      </div>
    </div>
  );
};

export default Login;
