import httpClient from './httpClient';

export async function listarCampanhasFeedback() {
  const { data } = await httpClient.get('/api/v1/feedback/campanhas');
  return data;
}

export async function criarCampanhaFeedback(payload) {
  const { data } = await httpClient.post('/api/v1/feedback/campanhas', payload);
  return data;
}

export async function atualizarCampanhaFeedback(id, payload) {
  const { data } = await httpClient.put(`/api/v1/feedback/campanhas/${id}`, payload);
  return data;
}

export async function dispararCampanhaFeedback(id) {
  await httpClient.post(`/api/v1/feedback/campanhas/${id}/disparar`);
}

export async function listarRespostasFeedback() {
  const { data } = await httpClient.get('/api/v1/feedback/respostas');
  return data;
}

export async function exportarFeedbackCsv() {
  const { data } = await httpClient.get('/api/v1/feedback/export.csv', {
    responseType: 'blob',
  });
  return data;
}

export async function buscarFormularioFeedback(token) {
  const { data } = await httpClient.get(`/api/v1/feedback/public/${token}`);
  return data;
}

export async function responderFormularioFeedback(token, payload) {
  await httpClient.post(`/api/v1/feedback/public/${token}`, payload);
}
