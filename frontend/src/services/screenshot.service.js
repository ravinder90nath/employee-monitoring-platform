import { API, BASE_URL } from './api';

export const screenshotService = {
  get: (email, date) => API.get('/screenshot/getscreenshots', { params: { email, date } }),
};

export const imgUrl = (p) => p
  ? (p.startsWith('http') ? p : `${BASE_URL}${p}`)
  : null;
