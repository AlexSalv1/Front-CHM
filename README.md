# CHM Frontend

Interface web do **Customer Health Management**, construída para gestores e equipes de academias acompanharem clientes, retenção, operação e decisões do dia a dia com rapidez.

## Para que serve

O front do CHM oferece uma experiência pensada para uso real em operação:

- login de gestor
- dashboard com visão executiva
- carteira de clientes com health score e risco
- ações sugeridas e envio rápido para WhatsApp
- equipes, funcionários, contratos e tarefas
- insumos, compras e manutenção
- feedback por e-mail com respostas anônimas
- branding por academia, para cada tenant ter sua identidade
- hotbar lateral compacta para produtividade

## Principais telas

- `Login`
- `Dashboard`
- `Executivo`
- `Clientes`
- `Contratos`
- `Tarefas`
- `Equipe`
- `Funcionarios`
- `Insumos`
- `Manutencao`
- `Feedback`
- `Configuracoes`
- `FeedbackPublico` para resposta em link público

## Stack

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Configure a URL da API local em `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

3. Rode o projeto:

```bash
npm run dev
```

4. Para build de produção:

```bash
npm run build
```

## Integração com a API

O front consome a API via `src/api/httpClient.js`.
As requisições usam `withCredentials` para trabalhar com o cookie httpOnly de autenticação.

## Deploy

O front está preparado para Vercel.
O arquivo `vercel.json` faz rewrite de `/api/*` para a API publicada, permitindo que o app continue consumindo os mesmos caminhos em produção.

## Observações de segurança e UX

- não há segredo sensível hardcoded no cliente
- o acesso administrativo é controlado pelo backend
- o menu principal foi otimizado como hotbar compacta
- a interface prioriza uso em desktop e celular sem duplicar tela desnecessariamente

## Repositório

Este front faz parte do ecossistema CHM, mas vive em repositório separado da API.
