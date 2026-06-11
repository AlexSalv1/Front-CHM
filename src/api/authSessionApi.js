import httpClient from './httpClient';

export async function verificarSessao(config = {}) {
  const { data } = await httpClient.post('/api/v1/auth/me', null, config);
  return data;
}
