import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  recordConsent: (userId) => api.post(`/auth/consent/${userId}`),
  uploadId: (userId, formData) =>
    api.post(`/auth/upload-id/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyLiveness: (userId) => api.post(`/auth/verify-liveness/${userId}`),
  getProfile: () => api.get('/auth/users/me'),
  updateProfile: (data) => api.put('/auth/users/me', data),
};

export const tripAPI = {
  estimateFare: (data) => api.post('/trips/estimate', data),
  bookRide: (data) => api.post('/trips/book', data),
  getHistory: () => api.get('/trips/history'),
  getDriverHistory: () => api.get('/trips/driver-history'),
  getActiveTrip: () => api.get('/trips/active'),
  updateLocation: (tripId, coords) => api.patch(`/trips/${tripId}/location`, coords),
  triggerAlert: (tripId, transcript) => api.post(`/trips/${tripId}/emergency`, { transcript }),
 getRideRequests: () => api.get('/trips/requests'),
  acceptRide: (tripId) => api.post(`/trips/${tripId}/accept`),

};

export const contactAPI = {
  list: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  remove: (id) => api.delete(`/contacts/${id}`),
};

export const vehicleAPI = {
  registerVehicle: (formData) =>
    api.post('/vehicles/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const adminAPI = {
  overview: () => api.get('/admin/overview'),
  trips: () => api.get('/admin/trips'),
  drivers: () => api.get('/admin/drivers'),
  passengers: () => api.get('/admin/passengers'),
  alerts: () => api.get('/admin/alerts'),
};

export default api;