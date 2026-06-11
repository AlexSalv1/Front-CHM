import httpClient from './httpClient';

export async function buscarBrandingEmpresa() {
  const { data } = await httpClient.get('/api/v1/empresa/branding');
  return data;
}

export async function atualizarBrandingEmpresa(payload) {
  const { data } = await httpClient.put('/api/v1/empresa/branding', payload);
  return data;
}
