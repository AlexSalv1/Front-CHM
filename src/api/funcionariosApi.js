import httpClient from './httpClient';

export async function listarFuncionarios() {
  const { data } = await httpClient.get('/api/v1/funcionarios');
  return data;
}

export async function criarFuncionario(payload) {
  const { data } = await httpClient.post('/api/v1/funcionarios', payload);
  return data;
}

export async function atualizarFuncionario(id, payload) {
  const { data } = await httpClient.put(`/api/v1/funcionarios/${id}`, payload);
  return data;
}

export async function excluirFuncionario(id) {
  await httpClient.delete(`/api/v1/funcionarios/${id}`);
}
