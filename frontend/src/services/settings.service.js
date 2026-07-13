import { API } from './api';

export const settingsService = {
  getShifts: () => API.get('/settings/shifts'),
  createShift: (d) => API.post('/settings/shifts', d),
  updateShift: (id, d) => API.put(`/settings/shifts/${id}`, d),
  deleteShift: (id) => API.delete(`/settings/shifts/${id}`),
  assignShift: (empEmail, shiftId) => API.post('/settings/shifts/assign', { empEmail, shiftId }),
  getApps: (p) => API.get('/settings/apps', { params: p }),
  updateAppCat: (id, category) => API.put(`/settings/apps/${id}`, { category }),
  addApp: (d) => API.post('/settings/apps', d),
};
