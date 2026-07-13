import { API } from './api';

export const dashboardService = {
  getData: () => API.get('/dashboard/getdashboarddata'),
  getTopFive: (p) => API.get('/dashboard/gettopfiveproddistract', { params: p }),
  getNetworkUsages: (p) => API.get('/dashboard/getnetworkusages', { params: p }),
  getWorkingHrs: (p) => API.get('/dashboard/getworkinghrsdata', { params: p }),
  getEmployeeList: () => API.get('/dashboard/getemployeelist'),
};
