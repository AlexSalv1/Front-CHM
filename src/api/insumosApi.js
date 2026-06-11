import httpClient from './httpClient';

export async function listarInsumos() {
  const { data } = await httpClient.get('/api/v1/insumos');
  return data;
}

export async function criarInsumo(payload) {
  const { data } = await httpClient.post('/api/v1/insumos', payload);
  return data;
}

export async function atualizarInsumo(id, payload) {
  const { data } = await httpClient.put(`/api/v1/insumos/${id}`, payload);
  return data;
}

export async function excluirInsumo(id) {
  await httpClient.delete(`/api/v1/insumos/${id}`);
}
