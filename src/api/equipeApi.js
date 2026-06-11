import httpClient from './httpClient';

export async function listarEquipe() {
  const { data } = await httpClient.get('/api/v1/equipe');
  return data;
}

export async function criarUsuarioEquipe(payload) {
  const { data } = await httpClient.post('/api/v1/equipe', payload);
  return data;
}

export async function atualizarUsuarioEquipe(id, payload) {
  const { data } = await httpClient.put(`/api/v1/equipe/${id}`, payload);
  return data;
}
