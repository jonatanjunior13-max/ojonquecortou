# Redesign do Painel /admin — "Obsidian Bronze"

**Data:** 2026-06-12
**Status:** Aprovado pelo usuário (brainstorming concluído)

## Objetivo

Redesign completo do painel administrativo do Studio do Jon (desktop + mobile hub) para torná-lo intuitivo, chique e super premium, corrigindo os bugs de contraste em produção e a dívida técnica de CSS/componentes no caminho.

## Contexto e problemas atuais

- **Dois temas brigando:** shell claro (`AdminNavbar.css`, "Light Theme") vs cards "Obsidian Bronze" escuros (`Admin.css`). Resultado: texto invisível em produção (KPIs do Financeiro, título do Login) — `--glass-bg: rgba(23,23,23,0.65)` com `color: var(--ink)` (#1A1310).
- **Dois accents divergentes:** `#c8852a` (index.css) vs `#B05A2E` (hardcoded em Admin.css).
- **~100 cores hex hardcoded** em Admin.css misturando paleta Tailwind genérica com a paleta da marca.
- **Monólitos:** Admin.css com 3.023 linhas; AdminDashboard.jsx com 204KB; AdminMobileApp.jsx com 307KB.
- **`alert()` nativo** para confirmações; loading com texto cru; emojis misturados com ícones Lucide; naming inconsistente (Campanhas / Campanhas & CRM / Marketing).
- Pesquisa de mercado (Booksy, Belasis, AppBarber, Graces, Zenoti): faltam visão "resumo do dia" e fechamento de comanda unificado.

## Decisões (aprovadas pelo usuário)

| Decisão | Escolha |
|---|---|
| Tema | **B — Obsidian Bronze** (dark premium; dourado sobre obsidiana) |
| Escopo | **Desktop completo (7 páginas + Login) + Mobile hub (AdminMobileApp)** |
| Features novas | **Home "Hoje"** + **Comanda inteligente** |
| Abordagem técnica | **B — Design system próprio + migração página a página** |
| Fora do escopo (backlog) | Fidelidade/clube de assinatura, re-engajamento automático, NFS-e nacional |

## Arquitetura

### Tokens (`src/styles/admin-tokens.css`, escopo `.admin-app`)

```css
/* Superfícies */
--adm-bg: #121110;          /* fundo geral, obsidiana */
--adm-surface: #1A1715;     /* sidebar, topbar, modais */
--adm-card: #211D1A;        /* cards */
--adm-card-hover: #282320;

/* Texto */
--adm-text: #F5EDDB;        /* pergaminho sobre escuro */
--adm-text-2: #C9BCA8;      /* secundário */
--adm-muted: #9A8D7E;       /* labels, hints */

/* Marca */
--adm-gold: #DCA354;        /* accent principal */
--adm-gold-deep: #C8852A;   /* hover/CTAs */
--adm-bronze: #965F1C;      /* detalhes */

/* Semânticas */
--adm-success: #97C459;  --adm-danger: #E24B4A;
--adm-warning: #EF9F27;  --adm-info: #85B7EB;

/* Estrutura */
--adm-rule: rgba(245,237,219,0.08);       /* hairlines */
--adm-rule-gold: rgba(220,163,84,0.25);   /* borda destaque */
--adm-radius-sm: 8px; --adm-radius: 12px; --adm-radius-lg: 16px;
/* Espaçamento: grade 8pt (4/8/16/24/32/48) */
```

**Tipografia:** DM Serif Display apenas para números grandes e títulos de página; Manrope para o resto; labels micro 11px uppercase com tracking 1px (único uso de uppercase).

**Regra dura:** páginas não escrevem hex. Só tokens. Lint visual na revisão de cada página migrada.

### Componentes base (`src/components/admin/ui/`, um arquivo por componente)

| Componente | Papel |
|---|---|
| `Card` | superfície padrão; variante `gold` (borda dourada) |
| `KpiCard` | label + valor serif grande + delta colorido + sparkline opcional |
| `Button` | primário (dourado, texto obsidiana), ghost, perigo |
| `Modal` | substitui modais ad-hoc |
| `Toast` | substitui `alert()`; fila no canto, auto-dismiss |
| `DataTable` | tabela com hover, densidade premium |
| `EmptyState` | ícone + frase da casa |
| `Badge`, `Input`, `Select`, `Tabs` | básicos consistentes |

**Restrição:** lógica Firebase/handlers/estado não muda — apenas a camada visual (JSX de apresentação + CSS). Coleções, queries e fluxos de dados existentes permanecem intactos.

## Design por área

### Shell (AdminLayout)

- Sidebar Obsidian; "Hoje" é o primeiro item e a rota padrão de `/admin`.
- Nomes de menu: Hoje, Agenda, Serviços, Clientes, Estoque, Financeiro, Campanhas, Ajustes. Naming unificado ("Campanhas" em todo lugar).
- "App Mobile" sai do menu lateral; vira ícone no topbar. Botão flutuante "Voltar para o App 📱" removido — em viewport mobile, o shell redireciona ao hub mobile.
- Topbar: título da página em serif; busca atual evolui para command palette `Ctrl+K` (mesma base de keywords, com ações: "agendar", "fechar caixa"); sino com badge dourado; "Olá, Jon" com avatar.
- Loading: logo bronze pulsando (skeleton), nunca texto cru.
- Emojis removidos da UI; apenas ícones Lucide.

### Login

- Estrutura dark mantida; contraste corrigido (texto pergaminho `--adm-text` sobre obsidiana).
- Logo monograma bronze substitui o logo pink. Borda do card com brilho dourado sutil em hover.

### Home "Hoje" (nova página, rota padrão)

- 3 KPIs: faturamento do dia (serif grande + delta vs mesmo dia da semana anterior), atendimentos/horários livres, pendências.
- Lista de próximos clientes: hora em serif dourado, nome, serviço, duração, atalho WhatsApp.
- Card "Aguardando aceite" com ação direta (reusa `handleAcceptBooking` existente).
- Aniversariantes do dia (campo `birthDate` da ficha).
- **Dados:** tudo derivado do `globalData` que o AdminLayout já carrega — zero query nova.

### Comanda inteligente (nova feature)

- Abre ao "fechar" um agendamento. Pré-preenche o serviço do booking.
- Adiciona produtos do estoque com busca; chips de gorjeta (5% / 10% / valor livre).
- Método de pagamento aplica taxa da maquininha automaticamente (taxas já existentes em configurações).
- Rodapé informativo: comissão calculada do profissional + baixa de estoque prevista.
- Ação única "Receber e fechar": lança transação no financeiro, registra comissão, baixa estoque, marca booking como finalizado. Substitui o fluxo atual de 3-4 telas.

### Financeiro

- KPIs migram para `KpiCard` (corrige o bug de texto invisível): faturamento, despesas, lucro, ticket médio — com delta vs período anterior e sparkline de 7 dias.
- Tabs atuais mantidas (Gráficos, Extrato, Comissões, Taxas, Pacotes) com visual novo.
- Extrato em `DataTable` com cores semânticas entrada/saída.

### Agenda

- Estrutura funcional mantida: visões Dia/Semana/Mês, bloqueios, multi-profissional.
- Data grande em serif ("Sexta-feira, **12** de junho"); slots com hairlines.
- Agendamento: card dourado-escuro com nome e serviço legíveis. Bloqueio: hachura discreta.
- Chips de status (pendentes/confirmados/cancelados/faltas) maiores e clicáveis como filtros.

### Clientes, Serviços, Estoque, Campanhas, Ajustes

- Migração direta para o design system: mesmos dados e fluxos, componentes novos.
- Ficha do cliente: cabeçalho com avatar/iniciais, total gasto, última visita.
- Estoque: alerta visual de estoque baixo.
- Campanhas: fluxo atual mantido com cards Obsidian.

### Mobile hub (AdminMobileApp)

- Mesmos tokens Obsidian; bottom-nav com "Hoje" central; cards grandes (alvo mínimo de toque 44px).
- Arquivo de 307KB quebrado em módulos por aba durante a migração.

### Estados e feedback

- `EmptyState` com ilustração de tesoura + frase da casa.
- Skeletons dourados em todos os loadings.
- `Toast` para toda confirmação e erro (zero `alert()`).

## Acessibilidade

- Contraste mínimo WCAG AA em todo par texto/fundo (pergaminho sobre obsidiana ≈ 13:1; dourado sobre obsidiana ≈ 7:1).
- Alvos de toque ≥ 44px no mobile hub; fontes mínimas 12px (corpo) / 11px (micro-labels).
- Tokens semânticos garantem que o bug "texto invisível" não possa reaparecer.

## Ordem de implementação (fases)

1. **Fundação:** tokens + componentes base + Toast substituindo `alert()`.
2. **Shell + Login:** AdminLayout Obsidian, command palette, login corrigido.
3. **Home "Hoje":** nova página, rota padrão.
4. **Financeiro + Comanda inteligente.**
5. **Agenda.**
6. **Clientes, Serviços, Estoque, Campanhas, Ajustes.**
7. **Mobile hub** (quebra do monólito + tema).

Cada fase é deployável de forma independente; páginas não migradas continuam funcionais com o tema antigo até sua vez (período transitório aceito).

## Critérios de sucesso

- Zero texto ilegível (auditoria de contraste em cada página migrada).
- Zero `alert()` nativo; zero hex hardcoded em páginas; um único accent.
- Painel abre em "Hoje" e o dono entende o dia em 5 segundos.
- Fechar atendimento (comanda → pagamento → comissão → estoque) em uma tela.
- Lógica de dados intocada: nenhuma regressão funcional nas 7 páginas + mobile.

## Testes

- Visual: screenshot por página migrada (desktop 1280/1440 + mobile 375) comparando antes/depois.
- Funcional: fluxos críticos manuais por fase — aceitar booking, fechar comanda, lançar transação, criar campanha.
- Contraste: verificação automática dos pares de token (script simples ou checagem manual com DevTools).
