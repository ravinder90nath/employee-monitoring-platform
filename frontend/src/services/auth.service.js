import { API } from './api';

export const authService = {
  login: (email, password) => API.post('/account/login', { email, password }),
  getDeptAndTitle: () => API.get('/account/getdepartmentandtitle'),
  getEmployeeList: () => API.get('/account/getemployeelist'),
  getUserList: () => API.get('/account/getuserlist'),
  assignRole: (email, role) => API.post('/account/assign-role', { email, role }),
  deleteUser: (empEmail) => API.post('/account/deltemanagementuser', { empEmail }),
  getStaff: (params) => API.get('/account/getstaffdetailsbyfilter', { params }),
};
