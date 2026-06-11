import httpClient from './httpClient';

export async function listarManutencoes() {
  const { data } = await httpClient.get('/api/v1/manutencoes');
  return data;
}

export async function criarManutencao(payload) {
  const { data } = await httpClient.post('/api/v1/manutencoes', payload);
  return data;
}

export async function atualizarManutencao(id, payload) {
  const { data } = await httpClient.put(`/api/v1/manutencoes/${id}`, payload);
  return data;
}

export async function excluirManutencao(id) {
  await httpClient.delete(`/api/v1/manutencoes/${id}`);
}
