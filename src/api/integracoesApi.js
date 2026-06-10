import httpClient from './httpClient';

export async function buscarConfigIntegracao() {
  const { data } = await httpClient.get('/api/v1/integracoes/config');
  return data;
}
