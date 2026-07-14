import { API } from './api';

export const browserService = {
  get: (email, from, to) => API.get('/browserhistory/getbrowserhistory', { params: { email, from, to } }),
};
