import axios from 'axios';

// Replace with your Render Backend URL once deployed
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API Methods
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyLiveness: (data) => api.post('/auth/verify-liveness', data),
};

export const tripAPI = {
  bookRide: (data) => api.post('/trips/book', data),
  getHistory: () => api.get('/trips/history'),
  updateLocation: (tripId, coords) => api.patch(`/trips/${tripId}/location`, coords),
  triggerAlert: (tripId, transcript) => api.post(`/trips/${tripId}/emergency`, { transcript }),
};

export const vehicleAPI = {
  registerVehicle: (data) => api.post('/vehicles/register', data),
};

export default api;