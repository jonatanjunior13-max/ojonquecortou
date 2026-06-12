# Plano de Implementação — Redesign Obsidian Bronze

**Spec:** `docs/superpowers/specs/2026-06-12-admin-redesign-design.md`
**Projeto:** React + Vite + Firebase

---

## Fase 1 — Tokens + Componentes base

**Objetivo:** Fundação visual. Zero alteração funcional.

### Tarefas

1. **Criar `src/styles/admin-tokens.css`**
   - Definir todos os tokens `--adm-*` conforme spec (superfícies, texto, marca, semânticas, estrutura)
   - Escopo `.admin-app` para não vazar pro site público
   - Importar em `AdminLayout.jsx`

2. **Criar `src/components/admin/ui/Toast.jsx` + `Toast.css`**
   - Fila de toasts no canto inferior direito
   - Tipos: `success`, `error`, `info`, `warning`
   - Auto-dismiss 4s, fechável manualmente
   - Exportar hook `useToast()`

3. **Substituir `alert()` por `useToast()`**
   - `AdminLayout.jsx:111` — confirmação de aceite de agendamento
   - Buscar demais `alert(` em `src/pages/admin/`

4. **Criar componentes base em `src/components/admin/ui/`**
   - `Card.jsx` — variantes: `default`, `gold` (borda dourada)
   - `KpiCard.jsx` — label + valor serif + delta + sparkline opcional
   - `Button.jsx` — variantes: `primary`, `ghost`, `danger`
   - `Badge.jsx` — variantes semânticas
   - `Input.jsx`, `Select.jsx` — wrappers estilizados
   - `Tabs.jsx` — substitui tabs ad-hoc atuais
   - `DataTable.jsx` — tabela hover-aware
   - `Modal.jsx` — overlay padrão
   - `EmptyState.jsx` — ícone + mensagem da casa
   - `Skeleton.jsx` — loading dourado

5. **Deletar variáveis duplicadas**
   - Remover `--glass-bg: rgba(23,23,23,0.65)` do topo de `Admin.css` (causa do bug de contraste)
   - Confirmar que nenhuma página referencia diretamente

**Critério de conclusão:** `npm run build` sem erros; componentes renderizam em isolamento; zero `alert()` no código admin.

---

## Fase 2 — Shell + Login

**Objetivo:** Layout global Obsidian Bronze, login corrigido.

### Tarefas

1. **Reescrever `AdminNavbar.css`** com tokens `--adm-*`
   - Sidebar: `--adm-surface` fundo, `--adm-rule` separadores
   - Item ativo: `--adm-gold` cor, `rgba(220,163,84,0.15)` fundo
   - Hover: `--adm-card-hover`

2. **Atualizar `AdminLayout.jsx`**
   - Adicionar "Hoje" como primeiro item de nav (rota `/admin/hoje`)
   - Renomear itens: Hoje / Agenda / Serviços / Clientes / Estoque / Financeiro / Campanhas / Ajustes
   - Mover "App Mobile" para ícone no topbar
   - Remover botão flutuante `position: fixed` "Voltar para o App 📱"
   - Rota padrão `/admin` redireciona para `/admin/hoje`
   - Loading: `<Skeleton>` com logo pulsando em vez de texto cru
   - Topbar: command palette `Ctrl+K` expandindo busca atual + atalho de teclado
   - Remover emojis (📱 ⏰ 🚫); manter Lucide

3. **Reescrever `AdminLogin.jsx`**
   - Fundo `--adm-bg`, card `--adm-surface`
   - Texto `--adm-text` (pergaminho) — corrige contraste invisível
   - Logo monograma bronze (SVG inline) substitui logo pink
   - Borda do card: hover com `--adm-rule-gold`
   - Usar `Button` e `Input` do design system

4. **Migrar `Admin.css` (parcial)**
   - Seções `.admin-app-container`, `.admin-sidebar`, `.admin-topbar`, `.admin-page-body`
   - Substituir hex hardcoded por tokens
   - Manter seções de páginas ainda não migradas intactas

**Critério:** Admin abre direto em `/admin/hoje` (tela vazia OK), login legível, topbar Obsidian, sidebar com novo naming.

---

## Fase 3 — Home "Hoje"

**Objetivo:** Nova página resumo do dia, rota padrão.

### Tarefas

1. **Criar `src/pages/admin/AdminHoje.jsx`**
   - Dados: todos de `globalData` (zero query nova)
   - KPI faturamento do dia: `financial_transactions` filtradas por hoje
   - KPI atendimentos: `bookings` de hoje com count por status
   - KPI pendências: `bookings.filter(b => b.status === 'pendente').length`
   - Lista próximos clientes (3 próximos de hoje, ordenados por hora)
   - Card "Aguardando aceite" com `handleAcceptBooking` passado via `useOutletContext`
   - Aniversariantes do dia: `clients.filter(c => isBirthdayToday(c.birthDate))`

2. **Adicionar rota em `App.jsx` (ou router)**
   - `/admin/hoje` → `<AdminHoje />`
   - Redirect `/admin` → `/admin/hoje`

3. **Estilizar com tokens Obsidian** usando componentes do design system

**Critério:** Dono vê faturamento, próximos clientes e pendências em 5 segundos ao abrir o painel.

---

## Fase 4 — Financeiro + Comanda inteligente

**Objetivo:** Corrigir a página mais quebrada + feature de maior impacto operacional.

### Tarefas

1. **Migrar `AdminFinancial.jsx`**
   - KPIs: `KpiCard` com delta vs semana anterior (corrige texto invisível)
   - Sparkline 7 dias no `KpiCard` de faturamento
   - `DataTable` para extrato; cores semânticas `--adm-success` / `--adm-danger`
   - Tabs com componente `Tabs`
   - Migrar 108KB de CSS inline → tokens

2. **Criar `src/components/admin/ComandaModal.jsx`**
   - Props: `booking`, `services`, `products`, `settings`, `onClose`, `onConfirm`
   - Pré-preenche serviço do booking
   - Busca de produtos do estoque (filtra `products` por nome)
   - Chips de gorjeta: 5% / 10% / valor livre
   - Seleção de método de pagamento com taxa automática (de `settings.feeXxx`)
   - Cálculo em tempo real: total = serviço + produtos + gorjeta
   - Rodapé informativo: comissão do profissional + baixa de estoque prevista
   - Botão "Receber e fechar":
     - `addDoc(collection(db, 'financial_transactions'), {...})` — lança entrada
     - `updateDoc(doc(db, 'bookings', booking.id), { status: 'finalizado' })` — fecha agendamento
     - Baixa de estoque: `updateDoc` em cada produto usado
     - Comissão: lança na coleção de comissões existente
     - Toast de sucesso

3. **Integrar botão "Fechar comanda" na `AdminDashboard.jsx`**
   - Adicionar opção no menu de ações do agendamento (MoreVertical já existente em linha 29)
   - Abre `<ComandaModal>`

**Critério:** Fechar atendimento em uma tela; transação, comissão e estoque em sync; zero alert().

---

## Fase 5 — Agenda

**Objetivo:** Visual Obsidian, sem tocar na lógica de bloqueios/visões.

### Tarefas

1. **Migrar CSS da Agenda em `Admin.css`**
   - Data grande em DM Serif
   - Slots com hairlines `--adm-rule`
   - Card de agendamento: fundo `--adm-card`, borda `--adm-rule-gold`, texto pergaminho
   - Bloqueio: hachura discreta em vez de cor sólida
   - Chips de status maiores e clicáveis como filtros (lógica de filtro já existe)

2. **Migrar `AdminDashboard.jsx` componentes visuais**
   - Botões → `Button`
   - Modais existentes → `Modal`
   - Toasts em confirmações restantes

**Critério:** Visões Dia/Semana/Mês funcionam; agendamentos legíveis; chips filtram.

---

## Fase 6 — Páginas restantes

**Objetivo:** Completar cobertura desktop.

### Tarefas (uma a uma)

1. **`AdminClients.jsx`** — Ficha: cabeçalho com avatar/iniciais, total gasto, última visita. Componentes `Card`, `DataTable`, `Tabs`.
2. **`AdminServices.jsx`** — Cards de serviço com `Card gold`. Botões `Button`.
3. **`AdminInventory.jsx`** — Alerta visual `Badge danger` para estoque baixo. `DataTable`.
4. **`AdminMarketing.jsx`** — Cards Obsidian, `DataTable` de clientes. Toasts.
5. **`AdminSettings.jsx`** — `Tabs`, `Input`, `Button`. Migrar inline styles.

Para cada página:
- Substituir hex hardcoded por tokens
- Substituir `alert()` por `useToast()`
- Substituir modais ad-hoc por `Modal`

**Critério:** Nenhuma página com hex hardcoded; zero `alert()`; contraste AA em toda combinação texto/fundo.

---

## Fase 7 — Mobile hub

**Objetivo:** AdminMobileApp.jsx Obsidian Bronze, arquivo quebrado em módulos.

### Tarefas

1. **Mapear `AdminMobileApp.jsx` (307KB)**
   - Identificar abas/seções lógicas
   - Extrair em módulos: `AdminMobileAgenda.jsx`, `AdminMobileFinanceiro.jsx`, etc.

2. **Aplicar tokens Obsidian**
   - Bottom-nav: "Hoje" no centro
   - Alvos de toque ≥ 44px em todos os controles
   - Fontes mínimas 12px

3. **Testar em viewport 375px**
   - Screenshot antes/depois
   - Verificar rolagem e sobreposições

**Critério:** Hub mobile renderiza Obsidian; arquivo principal < 100KB; alvos de toque OK.

---

## Cleanup final

- Deletar blocos CSS mortos de `Admin.css` após todas as fases
- Remover `AdminMobile.css` se coberto pelos tokens
- Confirmar que `Admin.css` restante ≤ 500 linhas (de 3.023)
- `git tag v2.0.0-admin-redesign`

---

## Ordem recomendada de commits

Cada fase → 1 commit por arquivo modificado (não commit em bloco). Facilita rollback por página.

```
feat(admin): tokens Obsidian Bronze + componentes base
feat(admin): substituir alert() por Toast
feat(admin/shell): AdminLayout Obsidian Bronze
feat(admin/login): corrigir contraste + logo bronze
feat(admin/hoje): nova home resumo do dia
feat(admin/financeiro): KpiCards legíveis + ComandaModal
feat(admin/agenda): visual Obsidian
feat(admin/clientes): migração design system
feat(admin/servicos): migração design system
feat(admin/estoque): migração + badge estoque baixo
feat(admin/marketing): migração design system
feat(admin/settings): migração design system
feat(admin/mobile): Obsidian Bronze + quebra de módulos
chore(admin): deletar CSS morto, tag v2.0.0
```
