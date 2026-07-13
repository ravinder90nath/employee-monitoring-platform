import { create } from 'zustand';
import { API } from '../services/api';

const useAuthStore = create((set) => ({
  user:  null,
  token: localStorage.getItem('ems_token'),

  login: async (email, password) => {
    const r = await API.post('/account/login', { email, password });
    const d = r.data?.data || r.data;
    localStorage.setItem('ems_token', d.accessToken);
    set({ token: d.accessToken, user: d });
    return d;
  },

  logout: () => {
    localStorage.removeItem('ems_token');
    set({ user: null, token: null });
    window.location.href = '/login';
  },
}));

export default useAuthStore;
