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

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string)            => api.post('/auth/refresh', { refreshToken }),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:     ()                           => api.get('/users'),
  create:     (data: any)                  => api.post('/users', data),
  update:     (id: string, data: any)      => api.put(`/users/${id}`, data),
  deactivate: (id: string)                 => api.delete(`/users/${id}`),
};

// ── Clientes ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  getAll:     ()                           => api.get('/clients'),
  getOne:     (id: string)                 => api.get(`/clients/${id}`),
  getMe:      ()                           => api.get('/clients/me'),
  create:     (data: any)                  => api.post('/clients', data),
  update:     (id: string, data: any)      => api.put(`/clients/${id}`, data),
  deactivate: (id: string)                 => api.delete(`/clients/${id}`),
};

// ── Calendario / Vencimientos ─────────────────────────────────────────────────
export const calendarApi = {
  getProximos:  ()                          => api.get('/calendar/proximos'),
  getByClient:  (clientId: string)          => api.get(`/calendar/client/${clientId}`),
  generar:      (clientId: string)          => api.post(`/calendar/client/${clientId}/generar`),
  completar:    (id: string)                => api.patch(`/calendar/${id}/completar`),
};

// ── Credenciales ──────────────────────────────────────────────────────────────
export const credentialsApi = {
  getByClient: (clientId: string)          => api.get(`/credentials/client/${clientId}`),
  reveal:      (id: string)                => api.get(`/credentials/${id}/reveal`),
  create:      (data: any)                 => api.post('/credentials', data),
  delete:      (id: string)                => api.delete(`/credentials/${id}`),
};

// ── Honorarios ────────────────────────────────────────────────────────────────
export const feesApi = {
  getByClient: (clientId: string)          => api.get(`/fees/client/${clientId}`),
  resumen:     ()                          => api.get('/fees/resumen'),
  create:      (clientId: string, data: any) => api.post(`/fees/client/${clientId}`, data),
  update:      (id: string, data: any)     => api.put(`/fees/${id}`, data),
  marcarPago:  (id: string, data: any)     => api.patch(`/fees/${id}/pago`, data),
  delete:      (id: string)               => api.delete(`/fees/${id}`),
};

// ── Movimientos ──────────────────────────────────────────────────────────────
export const movementsApi = {
  getByClient:       (clientId: string, params?: { tipo?: string; desde?: string; hasta?: string }) =>
    api.get(`/movements/client/${clientId}`, { params }),
  resumenMensual:    (clientId: string, periodo: string) =>
    api.get(`/movements/client/${clientId}/resumen/${periodo}`),
  create:            (clientId: string, data: any) =>
    api.post(`/movements/client/${clientId}`, data),
  update:            (id: string, data: any)      => api.put(`/movements/${id}`, data),
  delete:            (id: string)                 => api.delete(`/movements/${id}`),
};

// ── Notificaciones ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:      ()                          => api.get('/notifications'),
  unreadCount: ()                          => api.get('/notifications/unread-count'),
  markAllRead: ()                          => api.patch('/notifications/read-all'),
};
