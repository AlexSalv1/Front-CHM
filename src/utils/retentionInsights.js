export function formatCurrency(value) {
  if (value === null || value === undefined) return 'Oculto';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export function riskBucket(score) {
  if (score > 60) return 'saudavel';
  if (score >= 40) return 'atencao';
  return 'risco';
}

export function getRiskReasons(cliente) {
  const score = Number(cliente?.healthScore || 0);
  const reasons = [];

  if (score <= 25) reasons.push('Health score em nível crítico');
  else if (score <= 40) reasons.push('Queda forte de engajamento');
  else if (score <= 60) reasons.push('Sinais preventivos de insatisfação');

  if (cliente?.statusContrato === 'PAUSADO') reasons.push('Contrato pausado');
  if (cliente?.statusContrato === 'CANCELADO') reasons.push('Contrato cancelado ou em churn');
  if (!cliente?.telefone) reasons.push('Sem telefone para contato rápido');
  if (Number(cliente?.valorMensalidade || 0) >= 1000) reasons.push('Alto impacto financeiro');

  if (reasons.length === 0) reasons.push('Cliente saudável no momento');
  return reasons;
}

export function getRecommendedAction(cliente) {
  const score = Number(cliente?.healthScore || 0);

  if (cliente?.statusContrato === 'CANCELADO' || score <= 25) {
    return 'Ligar hoje e oferecer um plano de recuperação';
  }

  if (cliente?.statusContrato === 'PAUSADO') {
    return 'Entender a pausa e propor retomada simples';
  }

  if (score <= 40) {
    return 'Enviar WhatsApp e agendar reunião em até 24h';
  }

  if (score <= 60) {
    return 'Mandar WhatsApp preventivo e oferecer suporte';
  }

  return 'Fortalecer relacionamento e coletar feedback';
}

export function buildSuggestedMessage(cliente) {
  const firstName = (cliente?.nome || '').trim().split(/\s+/)[0] || 'tudo bem';
  const score = Number(cliente?.healthScore || 0);

  if (cliente?.statusContrato === 'PAUSADO') {
    return `Olá ${firstName}, tudo bem? Vi que seu contrato está pausado e queria entender o melhor momento para retomarmos. Existe algo que possamos ajustar para facilitar?`;
  }

  if (score <= 40) {
    return `Olá ${firstName}, tudo bem? Estou acompanhando sua experiência e queria entender se existe algo dificultando seu uso. Posso te ajudar com algum ponto específico?`;
  }

  return `Olá ${firstName}, tudo bem? Estou passando para acompanhar sua experiência e garantir que está tudo funcionando bem. Tem algum ponto em que podemos melhorar para você?`;
}

export function buildWhatsAppUrl(telefone, mensagem) {
  const phone = (telefone || '').replace(/\D/g, '');
  return `https://api.whatsapp.com/send?${new URLSearchParams({ phone, text: mensagem }).toString()}`;
}

export function buildHealthHistory(cliente) {
  const current = Number(cliente?.healthScore || 0);
  const statusPenalty = cliente?.statusContrato === 'PAUSADO' ? 8 : cliente?.statusContrato === 'CANCELADO' ? 18 : 0;
  const drop = current <= 40 ? 34 : current <= 60 ? 18 : 8;
  const start = Math.min(100, current + drop + statusPenalty);
  const middle = Math.round((start + current) / 2);

  return [
    { label: 'Abr', value: Math.max(0, Math.min(100, start)) },
    { label: 'Mai', value: Math.max(0, Math.min(100, middle)) },
    { label: 'Jun', value: Math.max(0, Math.min(100, current)) },
  ];
}

export function getCancellationPatterns(clientes) {
  const patterns = [
    {
      title: 'Baixo uso percebido',
      count: clientes.filter((cliente) => Number(cliente.healthScore) <= 40).length,
      description: 'Clientes abaixo de 40 tendem a precisar de treinamento ou suporte guiado.',
    },
    {
      title: 'Pausa antes do cancelamento',
      count: clientes.filter((cliente) => cliente.statusContrato === 'PAUSADO').length,
      description: 'Contratos pausados indicam objeção ativa e precisam de um plano de retomada.',
    },
    {
      title: 'Falha no contato',
      count: clientes.filter((cliente) => !cliente.telefone).length,
      description: 'Sem telefone, a equipe perde velocidade para agir antes do churn.',
    },
  ];

  return patterns.sort((a, b) => b.count - a.count);
}
