// Arquivo: frontend/src/api/clientesApi.js
import httpClient from './httpClient';

export async function listarClientes() {
  const { data } = await httpClient.get('/api/v1/clientes');
  return data;
}

export async function buscarCliente(id) {
  const { data } = await httpClient.get(`/api/v1/clientes/${id}`);
  return data;
}

export async function criarCliente(payload) {
  const { data } = await httpClient.post('/api/v1/clientes', payload);
  return data;
}

export async function atualizarCliente(id, payload) {
  const { data } = await httpClient.put(`/api/v1/clientes/${id}`, payload);
  return data;
}

export async function excluirCliente(id) {
  await httpClient.delete(`/api/v1/clientes/${id}`);
}

export async function buscarMetricas() {
  const { data } = await httpClient.get('/api/v1/dashboard/metricas');
  return data;
}
