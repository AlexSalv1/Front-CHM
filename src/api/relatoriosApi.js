import httpClient from './httpClient';

export async function buscarRelatorioContratos(dias = 30) {
  const { data } = await httpClient.get('/api/v1/relatorios/contratos', {
    params: { dias },
  });
  return data;
}
