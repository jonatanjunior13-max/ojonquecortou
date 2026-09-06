#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';

// Carregar variáveis de ambiente do .env da raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'ojonque',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Autenticação Admin sob demanda
let authPromise = null;
async function ensureAuthenticated() {
  if (auth.currentUser) return auth.currentUser;
  if (!authPromise) {
    authPromise = (async () => {
      const email = process.env.CRON_FIREBASE_EMAIL || process.env.SMTP_USER || 'contato@ojonquecortou.com.br';
      let pass = process.env.CRON_FIREBASE_PASSWORD || process.env.SMTP_PASS || '';
      if (pass.startsWith('"') && pass.endsWith('"')) pass = pass.slice(1, -1);
      if (!pass) {
        console.error('[jon-crm-mcp] Aviso: CRON_FIREBASE_PASSWORD não definida, executando em modo leitura.');
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        console.error(`[jon-crm-mcp] Autenticado com sucesso como admin: ${email}`);
      } catch (err) {
        console.error('[jon-crm-mcp] Aviso: login admin falhou, executando em modo leitura:', err.message);
      }
    })();
  }
  await authPromise;
  return auth.currentUser;
}

// Helper para converter data para YYYY-MM-DD
const formatDate = (d) => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : (d.toDate ? d.toDate() : new Date(d));
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toISOString().split('T')[0];
};

// Formatar moeda brasileira
const formatBRL = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper para calcular intervalo de datas por período textual
const getDateRangeForPeriod = (period, startDate, endDate) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  switch (period) {
    case 'hoje':
    case 'today':
      return { start: todayStr, end: todayStr };

    case 'ontem':
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { start: yStr, end: yStr };
    }

    case 'esta_semana':
    case 'this_week': {
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - now.getDay());
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }

    case 'este_mes':
    case 'this_month': {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: mStart.toISOString().split('T')[0], end: todayStr };
    }

    case 'mes_passado':
    case 'last_month': {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lmStart.toISOString().split('T')[0], end: lmEnd.toISOString().split('T')[0] };
    }

    case 'ano':
    case 'this_year': {
      const yStart = new Date(now.getFullYear(), 0, 1);
      return { start: yStart.toISOString().split('T')[0], end: todayStr };
    }

    default:
      return null;
  }
};

// =========================================================================
// HANDLERS DAS FERRAMENTAS DO CRM
// =========================================================================

// 1. Resumo Financeiro / Caixa
async function handleGetFinancialSummary({ periodo = 'este_mes', data_inicio, data_fim }) {
  await ensureAuthenticated();
  const range = getDateRangeForPeriod(periodo, data_inicio, data_fim);
  const snap = await getDocs(collection(db, 'financial_transactions'));
  
  let totalEntradas = 0;
  let totalSaidas = 0;
  let totalComandas = 0;
  const porMetodo = {};
  const porCategoria = {};
  let contagemAtendimentos = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const txDate = data.date ? formatDate(data.date) : '';

    if (range) {
      if (txDate < range.start || txDate > range.end) return;
    }

    const valor = Number(data.value ?? data.amount ?? data.valor ?? 0);
    const tipo = (data.type || data.tipo || 'entrada').toLowerCase();
    const metodo = data.paymentMethod || data.metodo || 'Outros';
    const cat = data.category || data.categoria || 'Geral';

    if (tipo === 'entrada' || tipo === 'income') {
      totalEntradas += valor;
      porMetodo[metodo] = (porMetodo[metodo] || 0) + valor;
      porCategoria[cat] = (porCategoria[cat] || 0) + valor;
      contagemAtendimentos++;
    } else if (tipo === 'saida' || tipo === 'expense' || tipo === 'despesa') {
      totalSaidas += valor;
    } else if (tipo === 'comanda') {
      totalComandas += valor;
    }
  });

  const saldoLiquido = totalEntradas - totalSaidas;
  const ticketMedio = contagemAtendimentos > 0 ? (totalEntradas / contagemAtendimentos) : 0;

  return {
    periodo_solicitado: periodo,
    intervalo_datas: range ? `${range.start} até ${range.end}` : 'Todo o histórico',
    total_entradas_faturamento: formatBRL(totalEntradas),
    total_saidas_despesas: formatBRL(totalSaidas),
    saldo_liquido: formatBRL(saldoLiquido),
    ticket_medio: formatBRL(ticketMedio),
    total_atendimentos_registrados: contagemAtendimentos,
    faturamento_por_metodo_pagamento: Object.entries(porMetodo).map(([metodo, val]) => ({
      metodo,
      total: formatBRL(val),
      percentual: totalEntradas > 0 ? `${((val / totalEntradas) * 100).toFixed(1)}%` : '0%'
    })),
    faturamento_por_categoria: Object.entries(porCategoria).map(([categoria, val]) => ({
      categoria,
      total: formatBRL(val)
    }))
  };
}

// 2. Listar Transações Recentes
async function handleListFinancialTransactions({ tipo = 'todos', limite = 25, data_inicio, data_fim, categoria }) {
  await ensureAuthenticated();
  const snap = await getDocs(collection(db, 'financial_transactions'));
  const lista = [];

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const txDate = data.date ? formatDate(data.date) : '';
    const txTipo = (data.type || data.tipo || 'entrada').toLowerCase();
    const txCat = (data.category || data.categoria || 'Geral').toLowerCase();

    if (tipo !== 'todos' && txTipo !== tipo.toLowerCase()) return;
    if (categoria && !txCat.includes(categoria.toLowerCase())) return;
    if (data_inicio && txDate < data_inicio) return;
    if (data_fim && txDate > data_fim) return;

    lista.push({
      id: docSnap.id,
      data: txDate,
      cliente: data.clientName || data.cliente || '—',
      tipo: txTipo,
      categoria: data.category || data.categoria || 'Geral',
      metodo: data.paymentMethod || data.metodo || '—',
      valor: formatBRL(data.value ?? data.amount ?? data.valor ?? 0),
      descricao: data.description || data.descricao || ''
    });
  });

  lista.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  return {
    total_encontradas: lista.length,
    transacoes: lista.slice(0, Math.min(limite, 100))
  };
}

// 3. Consultar Estoque & Produtos
async function handleGetInventoryStatus({ somente_baixo_estoque = false, categoria, busca }) {
  await ensureAuthenticated();
  const snap = await getDocs(collection(db, 'products'));
  const produtos = [];
  let valorTotalCustoEstoque = 0;
  let valorTotalVendaEstoque = 0;
  let itensCriticosCount = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const nome = data.name || data.title || 'Produto sem nome';
    const cat = data.category || 'Geral';
    const qtd = Number(data.quantity || data.stock || data.estoque || 0);
    const minQtd = Number(data.minStock ?? data.minQuantity ?? data.estoqueMinimo ?? 3);
    const precoCusto = Number(data.costPrice || data.precoCusto || 0);
    const precoVenda = Number(data.sellingPrice ?? data.price ?? data.salePrice ?? data.precoVenda ?? 0);

    const isBaixoEstoque = qtd <= minQtd;
    if (isBaixoEstoque) itensCriticosCount++;

    if (somente_baixo_estoque && !isBaixoEstoque) return;
    if (categoria && !cat.toLowerCase().includes(categoria.toLowerCase())) return;
    if (busca && !nome.toLowerCase().includes(busca.toLowerCase())) return;

    const custoTotalItem = qtd * precoCusto;
    const vendaTotalItem = qtd * precoVenda;
    valorTotalCustoEstoque += custoTotalItem;
    valorTotalVendaEstoque += vendaTotalItem;

    produtos.push({
      id: docSnap.id,
      nome,
      categoria: cat,
      quantidade: qtd,
      estoque_minimo: minQtd,
      status: qtd === 0 ? '🔴 ZERADO' : (qtd <= minQtd ? '🟡 CRÍTICO/BAIXO' : '🟢 OK'),
      preco_custo: formatBRL(precoCusto),
      preco_venda: formatBRL(precoVenda),
      margem_lucro: precoCusto > 0 ? `${(((precoVenda - precoCusto) / precoCusto) * 100).toFixed(0)}%` : '—'
    });
  });

  produtos.sort((a, b) => a.quantidade - b.quantidade);

  return {
    resumo: {
      total_produtos_cadastrados: snap.size,
      produtos_em_alerta_ou_zerados: itensCriticosCount,
      valor_total_investido_em_estoque_custo: formatBRL(valorTotalCustoEstoque),
      potencial_de_faturamento_em_estoque_venda: formatBRL(valorTotalVendaEstoque)
    },
    produtos
  };
}

// 4. Buscar e Segmentar Clientes
async function handleSearchClients({ termo, dias_sem_visita_minimo, tipo_curvatura, limite = 25 }) {
  await ensureAuthenticated();
  const snap = await getDocs(collection(db, 'client_profiles'));
  const now = new Date();
  const clientes = [];

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const nome = data.name || data.nome || 'Cliente';
    const telefone = data.phone || data.telefone || '';
    const email = data.email || '';
    const curvatura = data.curlPattern || data.curvatura || data.hairType || '—';
    const ultimaVisita = data.lastVisit || data.ultimaVisita || '';

    let diasAusente = null;
    if (ultimaVisita) {
      const uDate = new Date(ultimaVisita);
      if (!isNaN(uDate.getTime())) {
        diasAusente = Math.floor((now.getTime() - uDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    if (termo) {
      const t = termo.toLowerCase();
      const matchNome = nome.toLowerCase().includes(t);
      const matchTel = telefone.replace(/\D/g, '').includes(t.replace(/\D/g, ''));
      const matchEmail = email.toLowerCase().includes(t);
      if (!matchNome && !matchTel && !matchEmail) return;
    }

    if (dias_sem_visita_minimo !== undefined && dias_sem_visita_minimo !== null) {
      if (diasAusente === null || diasAusente < Number(dias_sem_visita_minimo)) return;
    }

    if (tipo_curvatura) {
      if (!curvatura.toLowerCase().includes(tipo_curvatura.toLowerCase())) return;
    }

    clientes.push({
      id: docSnap.id,
      nome,
      telefone,
      email,
      curvatura,
      densidade: data.hairDensity || data.densidade || '—',
      porosidade: data.hairPorosity || data.porosidade || '—',
      ultima_visita: ultimaVisita ? formatDate(ultimaVisita) : 'Nunca veio / Não registrado',
      dias_sem_visitar: diasAusente !== null ? `${diasAusente} dias` : '—',
      total_gasto_acumulado: formatBRL(data.totalSpent || 0),
      total_visitas: data.appointmentsCount || data.visitas || 1,
      observacoes_tecnicas: data.notes || data.observacoes || ''
    });
  });

  clientes.sort((a, b) => (Number(b.total_visitas) || 0) - (Number(a.total_visitas) || 0));

  return {
    total_encontrados: clientes.length,
    clientes: clientes.slice(0, Math.min(limite, 100))
  };
}

// 5. Consultar Agenda & Atendimentos
async function handleGetAgenda({ data, data_inicio, data_fim, status = 'todos' }) {
  await ensureAuthenticated();
  const snap = await getDocs(collection(db, 'bookings'));
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = data || (!data_inicio && !data_fim ? todayStr : null);

  const agendamentos = [];

  snap.forEach(docSnap => {
    const item = docSnap.data();
    const itemDate = item.date ? formatDate(item.date) : '';
    const itemStatus = (item.status || 'pendente').toLowerCase();

    if (targetDate && itemDate !== targetDate) return;
    if (data_inicio && itemDate < data_inicio) return;
    if (data_fim && itemDate > data_fim) return;

    if (status !== 'todos' && !itemStatus.includes(status.toLowerCase())) return;

    agendamentos.push({
      id: docSnap.id,
      data: itemDate,
      horario: item.time || item.horario || '—',
      cliente: item.clientName || item.cliente || '—',
      telefone: item.clientPhone || item.telefone || '—',
      servico: item.serviceName || item.servico || '—',
      valor: formatBRL(item.finalValue ?? item.servicePrice ?? item.totalPrice ?? item.price ?? item.valor ?? 0),
      status: item.status || 'Confirmado',
      profissional: item.professional || 'Jon',
      observacoes: item.notes || ''
    });
  });

  agendamentos.sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));

  return {
    periodo_consultado: targetDate ? `Dia ${targetDate}` : `${data_inicio} até ${data_fim}`,
    total_agendamentos: agendamentos.length,
    agendamentos
  };
}

// 6. Catálogo de Serviços
async function handleGetServicesCatalog() {
  await ensureAuthenticated();
  const snap = await getDocs(collection(db, 'services'));
  const servicos = [];

  snap.forEach(docSnap => {
    const data = docSnap.data();
    servicos.push({
      id: docSnap.id,
      nome: data.name || data.nome || 'Serviço',
      preco: formatBRL(data.price || data.preco || 0),
      duracao_minutos: data.durationMinutes || data.duracao || 60,
      categoria: data.category || 'Cabelo',
      descricao: data.description || ''
    });
  });

  return {
    total_servicos: servicos.length,
    catalogo: servicos
  };
}

// 7. Visão Executiva Geral (Dashboard KPIs)
async function handleGetStudioKpis() {
  await ensureAuthenticated();
  const [finResumo, estoqueResumo, clientesSnap, servicosSnap] = await Promise.all([
    handleGetFinancialSummary({ periodo: 'este_mes' }),
    handleGetInventoryStatus({ somente_baixo_estoque: true }),
    getDocs(collection(db, 'client_profiles')),
    getDocs(collection(db, 'services'))
  ]);

  return {
    resumo_mes_atual: {
      faturamento_bruto: finResumo.total_entradas_faturamento,
      despesas: finResumo.total_saidas_despesas,
      lucro_liquido: finResumo.saldo_liquido,
      ticket_medio: finResumo.ticket_medio,
      atendimentos_realizados: finResumo.total_atendimentos_registrados
    },
    base_de_clientes: {
      total_clientes_cadastrados: clientesSnap.size
    },
    alertas_de_estoque: {
      produtos_criticos_ou_zerados: estoqueResumo.resumo.produtos_em_alerta_ou_zerados,
      itens_em_falta: estoqueResumo.produtos.map(p => `${p.nome} (${p.quantidade} un)`).slice(0, 5)
    },
    tabela_servicos: {
      total_servicos_oferecidos: servicosSnap.size
    }
  };
}

// =========================================================================
// INICIALIZAÇÃO DO SERVIDOR MCP
// =========================================================================

const server = new Server(
  {
    name: 'jon-crm-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Registrar a lista de ferramentas disponíveis
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'jon_obter_resumo_financeiro',
        description: 'Retorna o resumo do fluxo de caixa e faturamento do Studio do Jon (entradas, saídas, faturamento por Pix/Cartão, ticket médio e quantidade de atendimentos).',
        inputSchema: {
          type: 'object',
          properties: {
            periodo: {
              type: 'string',
              description: 'Período desejado: "hoje", "ontem", "esta_semana", "este_mes", "mes_passado", "ano", "tudo". Padrão é "este_mes".',
              enum: ['hoje', 'ontem', 'esta_semana', 'este_mes', 'mes_passado', 'ano', 'tudo']
            },
            data_inicio: {
              type: 'string',
              description: 'Data de início opcional no formato YYYY-MM-DD.'
            },
            data_fim: {
              type: 'string',
              description: 'Data de fim opcional no formato YYYY-MM-DD.'
            }
          }
        }
      },
      {
        name: 'jon_listar_transacoes_financeiras',
        description: 'Lista as transações financeiras individuais detalhadas (entradas, saídas, comandas de clientes).',
        inputSchema: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              description: 'Tipo da transação: "entrada", "saida", "comanda" ou "todos".',
              enum: ['entrada', 'saida', 'comanda', 'todos']
            },
            limite: {
              type: 'number',
              description: 'Quantidade máxima de transações a retornar (padrão 25).'
            },
            data_inicio: {
              type: 'string',
              description: 'Data inicial YYYY-MM-DD.'
            },
            data_fim: {
              type: 'string',
              description: 'Data final YYYY-MM-DD.'
            },
            categoria: {
              type: 'string',
              description: 'Filtrar por categoria (ex: Serviços, Produtos, Aluguel, etc).'
            }
          }
        }
      },
      {
        name: 'jon_consultar_estoque',
        description: 'Consulta os produtos e o estoque do Studio do Jon. Informa quais produtos estão acabando, preço de custo, preço de venda, margem e valor total investido.',
        inputSchema: {
          type: 'object',
          properties: {
            somente_baixo_estoque: {
              type: 'boolean',
              description: 'Se true, traz apenas os produtos com quantidade zerada ou menor que o estoque mínimo.'
            },
            categoria: {
              type: 'string',
              description: 'Filtrar por categoria do produto.'
            },
            busca: {
              type: 'string',
              description: 'Buscar por nome ou marca do produto.'
            }
          }
        }
      },
      {
        name: 'jon_buscar_clientes',
        description: 'Busca clientes no CRM do Studio do Jon por nome, telefone, curvatura do cabelo (2A a 4C) ou tempo sem visitar o estúdio (para campanhas de reativação).',
        inputSchema: {
          type: 'object',
          properties: {
            termo: {
              type: 'string',
              description: 'Termo de busca (nome, telefone ou e-mail).'
            },
            dias_sem_visita_minimo: {
              type: 'number',
              description: 'Filtrar clientes que não visitam o salão há pelo menos X dias (ex: 60 ou 90 dias).'
            },
            tipo_curvatura: {
              type: 'string',
              description: 'Filtrar por curvatura do cacho (ex: 2C, 3B, 4A, crespo, ondulado).'
            },
            limite: {
              type: 'number',
              description: 'Limite de clientes a retornar (padrão 25).'
            }
          }
        }
      },
      {
        name: 'jon_consultar_agenda',
        description: 'Consulta os agendamentos de clientes no estúdio para hoje ou qualquer intervalo de datas com status, serviços e valores.',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'string',
              description: 'Data específica no formato YYYY-MM-DD. Se omitido, consulta o dia de hoje.'
            },
            data_inicio: {
              type: 'string',
              description: 'Data inicial para consulta de período YYYY-MM-DD.'
            },
            data_fim: {
              type: 'string',
              description: 'Data final para consulta de período YYYY-MM-DD.'
            },
            status: {
              type: 'string',
              description: 'Filtrar por status: "confirmado", "pendente", "concluido", "cancelado", "todos".',
              enum: ['confirmado', 'pendente', 'concluido', 'cancelado', 'todos']
            }
          }
        }
      },
      {
        name: 'jon_catalogo_servicos',
        description: 'Retorna a tabela completa de serviços do Studio do Jon com preços, duração e descrição.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'jon_dashboard_geral',
        description: 'Retorna uma visão 360º consolidada do Studio do Jon: faturamento do mês, total de clientes, alertas críticos de estoque e catálogo.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

// Executar ferramenta solicitada pelo Claude
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result = null;

    switch (name) {
      case 'jon_obter_resumo_financeiro':
        result = await handleGetFinancialSummary(args);
        break;

      case 'jon_listar_transacoes_financeiras':
        result = await handleListFinancialTransactions(args);
        break;

      case 'jon_consultar_estoque':
        result = await handleGetInventoryStatus(args);
        break;

      case 'jon_buscar_clientes':
        result = await handleSearchClients(args);
        break;

      case 'jon_consultar_agenda':
        result = await handleGetAgenda(args);
        break;

      case 'jon_catalogo_servicos':
        result = await handleGetServicesCatalog();
        break;

      case 'jon_dashboard_geral':
        result = await handleGetStudioKpis();
        break;

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (err) {
    console.error(`Erro ao executar ferramenta ${name}:`, err);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Erro ao executar ${name}: ${err.message}`
        }
      ]
    };
  }
});

// Iniciar conexão Stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server [jon-crm-mcp] iniciado com sucesso no canal Stdio.');
}

main().catch(err => {
  console.error('Erro fatal ao iniciar MCP Server:', err);
  process.exit(1);
});
