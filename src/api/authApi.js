// Arquivo: frontend/src/api/authApi.js
import httpClient from './httpClient';

export async function login(email, senha) {
  const { data } = await httpClient.post('/api/v1/auth/login', { email, senha });
  return data;
}

export async function logout() {
  const { data } = await httpClient.post('/api/v1/auth/logout');
  return data;
}
