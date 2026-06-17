# Admin Redesign — Obsidian Bronze — Handoff

Branch: `feat/admin-redesign-obsidian`  
Stack: React + Vite + Firebase  
Prod: `ojonquecortou.com.br`  
Status: **COMPLETO — pronto para merge/teste**

---

## 1. Tema: Obsidian Bronze

Tokens em `src/styles/admin-tokens.css`, importado em `AdminLayout.jsx`.  
Scoped em `.admin-app`.

```css
--adm-bg: #121110
--adm-surface: #1A1715
--adm-card: #211D1A
--adm-card-hover: #282320
--adm-text: #F5EDDB
--adm-text-2: #C9BCA8
--adm-muted: #9A8D7E
--adm-gold: #DCA354
--adm-gold-deep: #C8852A
--adm-bronze: #965F1C
--adm-success: #97C459
--adm-danger: #E24B4A
--adm-warning: #EF9F27
--adm-info: #85B7EB
--adm-rule: rgba(245,237,219,0.08)
--adm-rule-gold: rgba(220,163,84,0.25)
--adm-radius-sm: 8px
--adm-radius-lg: 16px
```

**CUIDADO:** `index.css` tem vars globais (`--ink`, `--surface`, `--accent`) escuras/claras — ficam invisíveis em fundo dark. Sempre substituir por `--adm-*` em código novo.

---

## 2. O que foi feito (completo)

### Commits na branch

| Commit | O que fez |
|---|---|
| `3f68f9a` | Tokens Obsidian Bronze + Toast component + useToast hook |
| `051aab8` | Substituiu todos os `alert()` por Toast |
| `5d08e33` | Componentes base UI (Card, KpiCard, Button, Badge, Input, Select, Tabs, DataTable, Modal, EmptyState, Skeleton) |
| `50a5598` | Removeu vars glass/dark + fix bug invisível |
| `0fa14b4` | AdminNavbar.css, AdminLayout.jsx, AdminLogin.jsx, AdminHoje.jsx (nova), App.jsx (rota /hoje) |
| `3e3695c` | ComandaModal.jsx + integração na Agenda + handleFinalizeFromComanda |
| `e85a48b` | Admin.css — 357 ocorrências migradas para tokens dark |
| `c4f30be` | AdminClients, AdminServices, AdminInventory, AdminMarketing, AdminSettings |
| `ba968d3` | AdminMobileApp.jsx — migration completa |

### Arquivos novos criados
- `src/styles/admin-tokens.css` — design system tokens
- `src/components/admin/ui/Toast.jsx` + `Toast.css` — toast system
- `src/components/admin/ui/Card.jsx` — Card com variante gold
- `src/components/admin/ui/KpiCard.jsx` — KPI card com variantes
- `src/components/admin/ui/Button.jsx`
- `src/components/admin/ui/Badge.jsx`
- `src/components/admin/ui/Input.jsx`
- `src/components/admin/ui/Select.jsx`
- `src/components/admin/ui/Tabs.jsx`
- `src/components/admin/ui/DataTable.jsx`
- `src/components/admin/ui/Modal.jsx`
- `src/components/admin/ui/EmptyState.jsx`
- `src/components/admin/ui/Skeleton.jsx`
- `src/components/admin/ComandaModal.jsx` — modal fechar comanda
- `src/pages/admin/AdminHoje.jsx` — dashboard do dia

---

## 3. Componentes UI

Em `src/components/admin/ui/`:

| Componente | Props principais |
|---|---|
| `<Card>` | `variant` ("gold"), `style` |
| `<KpiCard>` | `label`, `value`, `sub`, `icon`, `variant` |
| `<Button>` | `variant`, `size`, `loading`, `icon` |
| `<Badge>` | `variant`, `size` |
| `<Input>` | `label`, `error`, `icon` |
| `<Select>` | `label`, `options` |
| `<Tabs>` | `tabs`, `activeTab`, `onChange` |
| `<DataTable>` | `columns`, `data`, `empty` |
| `<Modal>` | `open`, `onClose`, `title`, `size` |
| `<EmptyState>` | `icon`, `title`, `description` |
| `<Skeleton>` | `width`, `height`, `circle` |
| `useToast` | hook: `const toast = useToast(); toast('msg', 'success')` |

`ToastProvider` já envolve tudo via `AdminLayout.jsx`.

---

## 4. ComandaModal — como usar

`src/components/admin/ComandaModal.jsx`

Props: `{ booking, products, services, settings, onClose, onConfirm }`

`onConfirm` recebe payload:
```js
{ paymentMethod, tipValue, addedProducts /* {productId,name,price,qty} */,
  overrideBasePrice, total, netTotal, feeAmount }
```

`handleFinalizeFromComanda(booking, payload)` em `AdminDashboard.jsx` processa o payload e escreve no Firebase. O botão "Comanda" no popover da agenda já abre este modal.

---

## 5. Rotas

```
/admin           → redirect para /admin/hoje
/admin/hoje      → AdminHoje.jsx (dashboard do dia)
/admin/agenda    → AdminDashboard.jsx
/admin/servicos  → AdminServices.jsx
/admin/clientes  → AdminClients.jsx
/admin/estoque   → AdminInventory.jsx
/admin/financeiro → AdminFinancial.jsx
/admin/campanhas → AdminMarketing.jsx
/admin/ajustes   → AdminSettings.jsx
```

Outlet context: `{ globalData, setGlobalData, handleAcceptBooking }`

---

## 6. Padrões e gotchas

**Unicode no Edit tool:** arquivos com chars acentuados podem ter escapes literais `ç` no bytecode. Se Edit falhar com "string not found", dar Read no trecho exato primeiro.

**Firebase demo mode:** `isDemoMode = !db`. Toda escrita tem branch `if (isDemoMode || !db) { localStorage... } else { Firebase... }`.

**`color: #fff` em botões dourados:** usar `#121110` (já corrigido em todo o CSS). Em botões de cores escuras (danger, success) `#fff` está certo.

**`--adm-rule-gold`** já existe como token — usar para bordas gold.

---

## 7. Para fazer (próximas melhorias)

- Quebrar `AdminMobileApp.jsx` (6817 linhas) em sub-componentes por tab
- Adicionar `<Skeleton>` nos estados de loading das páginas migradas
- Implementar `<DataTable>` substituindo `<table>` legacy em AdminClients
- Testes E2E do fluxo Comanda

---

## 8. Como rodar

```bash
cd C:\Users\jonat\Documents\antigravity\proud-lovelace
git checkout feat/admin-redesign-obsidian
npm run dev
# acesse /admin
```

Para merge:
```bash
git checkout main
git merge feat/admin-redesign-obsidian
```
