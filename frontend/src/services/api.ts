import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken, setTokens } = useAuthStore.getState();
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        setTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
export default api;
export const authApi = {
  login:   (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string)            => api.post('/auth/refresh', { refreshToken }),
};
export const usersApi = {
  getAll:     ()                      => api.get('/users'),
  create:     (data: any)             => api.post('/users', data),
  update:     (id: string, data: any) => api.put(`/users/${id}`, data),
  deactivate: (id: string)            => api.delete(`/users/${id}`),
};
export const clientsApi = {
  getAll:     ()                      => api.get('/clients'),
  getOne:     (id: string)            => api.get(`/clients/${id}`),
  create:     (data: any)             => api.post('/clients', data),
  update:     (id: string, data: any) => api.put(`/clients/${id}`, data),
  deactivate: (id: string)            => api.delete(`/clients/${id}`),
};
export const calendarApi = {
  getProximos: ()             => api.get('/calendar/proximos'),
  getByClient: (id: string)  => api.get(`/calendar/client/${id}`),
  generar:     (id: string)  => api.post(`/calendar/client/${id}/generar`),
};
export const credentialsApi = {
  getByClient: (id: string)  => api.get(`/credentials/client/${id}`),
  reveal:      (id: string)  => api.get(`/credentials/${id}/reveal`),
  create:      (data: any)   => api.post('/credentials', data),
  delete:      (id: string)  => api.delete(`/credentials/${id}`),
};
export const feesApi = {
  getByClient: (id: string)            => api.get(`/fees/client/${id}`),
  resumen:     ()                      => api.get('/fees/resumen'),
  marcarPago:  (id: string, data: any) => api.patch(`/fees/${id}/pago`, data),
};
export const notificationsApi = {
  getAll:      ()  => api.get('/notifications'),
  unreadCount: ()  => api.get('/notifications/unread-count'),
  markAllRead: ()  => api.patch('/notifications/read-all'),
};
