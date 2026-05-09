import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email, password) => axios.post(`${API_BASE_URL}/auth/login`, { email, password }, { withCredentials: true }),
  logout: () => axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true }),
  me: () => axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true }),
};

// Account
export const accountApi = {
  get: () => api.get('/account'),
  disconnect: () => api.delete('/account/disconnect'),
};

// Automations
export const automationsApi = {
  list: () => api.get('/automations'),
  getById: (id) => api.get(`/automations/${id}`),
  create: (data) => api.post('/automations', data),
  update: (id, data) => api.put(`/automations/${id}`, data),
  toggle: (id, is_enabled) => api.patch(`/automations/${id}/toggle`, { is_enabled }),
  delete: (id) => api.delete(`/automations/${id}`),
};

// Logs
export const logsApi = {
  getLogs: (params) => api.get('/logs', { params }),
  getStats: () => api.get('/logs/stats'),
  getFailedJobs: (params) => api.get('/logs/failed-jobs', { params }),
};

export default api;
