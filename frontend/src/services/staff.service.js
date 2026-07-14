import { API } from './api';

export const staffService = {
  getTimeSetting: (email) => API.get('/settings/timesettings', { params: { email } }),
  updateTimeSettings: (data, params) => API.post('/settings/timesettings', data, { params }),
  toggleService: (data) => API.post('/settings/timesettings/toggle', data),
  refreshAgentSettings: (email) => API.post('/machine/refresh', { email }),
  getSessionList: (p) => API.get('/admin/getsessionlist', { params: p }),
  deleteEmployee: (email) => API.get('/admin/deleteemployee', { params: { Email: email } }),
};
