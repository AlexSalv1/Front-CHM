// Arquivo: frontend/src/api/tarefasApi.js
import httpClient from './httpClient';

export async function listarTarefasPendentes() {
  const { data } = await httpClient.get('/api/v1/tarefas');
  return data;
}

export async function executarTarefa(id) {
  const { data } = await httpClient.post(`/api/v1/tarefas/${id}/executar`);
  return data;
}
