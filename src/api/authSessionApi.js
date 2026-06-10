import httpClient from './httpClient';

export async function verificarSessao() {
  const { data } = await httpClient.post('/api/v1/auth/me');
  return data;
}
