import httpClient from './httpClient';

export async function listarAssinaturasAdmin() {
  const { data } = await httpClient.get('/api/v1/admin/assinaturas');
  return data;
}

export async function atualizarAssinaturaAdmin(empresaId, payload) {
  const { data } = await httpClient.put(`/api/v1/admin/assinaturas/${empresaId}`, payload);
  return data;
}
