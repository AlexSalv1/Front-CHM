// Arquivo: frontend/src/api/httpClient.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? ''
  : import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/me')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
