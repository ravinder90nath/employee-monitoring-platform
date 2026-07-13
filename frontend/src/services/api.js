import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API = axios.create({ baseURL: API_URL, timeout: 30000 });

API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('ems_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

API.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('ems_token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// Raw fetch with auth header (for direct use in components)
export const authFetch = (url) =>
  fetch(url.startsWith('http') ? url : `${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('ems_token')}` }
  }).then(r => r.json()).then(d => d.data ?? d);
