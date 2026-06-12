# CHM Frontend

Interface web da plataforma **Customer Health Management**, criada para gestores e equipes de academias acompanharem clientes, retencao, operacao e decisoes do dia a dia com agilidade.

## Visao Geral

O CHM ajuda academias a identificar clientes em risco, organizar tarefas de contato, acompanhar indicadores importantes e centralizar rotinas administrativas em uma experiencia simples de usar.

## Funcionalidades

- Dashboard de acompanhamento da carteira
- Health score e ranking de clientes em risco
- Sugestoes de acao para retencao
- Acesso rapido a mensagens de contato
- Gestao de equipe e permissoes
- Area de funcionarios
- Controle de insumos, compras e manutencao
- Feedbacks anonimos configurados pelo gestor
- Personalizacao de marca por academia
- Hotbar compacta para produtividade
- Layout responsivo para desktop, tablet e celular

## Stack

- React
- Vite
- React Router
- Axios
- Tailwind CSS

## Execucao Local

Este projeto depende de configuracoes de ambiente externas ao repositorio.
Nao publique arquivos de ambiente, tokens, credenciais, URLs privadas ou dados reais de clientes.

Fluxo basico para desenvolvimento:

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

## Seguranca

O frontend nao deve armazenar segredos sensiveis. Qualquer permissao exibida na interface deve ser validada tambem pelo backend.

Evite documentar endpoints internos, nomes de variaveis sensiveis, detalhes de infraestrutura ou exemplos com credenciais. Dados reais de clientes, funcionarios e operacao nunca devem entrar no repositorio.

## Deploy

O deploy deve usar variaveis configuradas no provedor escolhido e apontar apenas para ambientes autorizados. Antes de publicar, valide build, permissoes visuais e fluxos principais de autenticacao.

## Repositorio Relacionado

A API do CHM vive em outro repositorio e e responsavel pelas regras de negocio, dados e permissoes.
