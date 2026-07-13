import { API } from './api';

export const reportsService = {
  activityLog: (p) => API.get('/reports/activitylog', { params: p }),
  workingCompliance: (p) => API.get('/reports/workinghrscompliance', { params: p }),
  productivity: (p) => API.get('/reports/productivity', { params: p }),
  activityLogByUser: (p) => API.get('/reports/activitylogbyuser', { params: p }),
};
