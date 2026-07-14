import { API } from './api';

export const adminService = {
  getAgentLogs: (from, to) => API.get('/admin/getagentlogs', { params: { fromDate: from, toDate: to } }),
};
