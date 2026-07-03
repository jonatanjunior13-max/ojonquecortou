# Status Atual do Projeto — O Jon Que Cortou (02/07/2026)

Este documento foi gerado para guiar a continuação do desenvolvimento e debug do projeto.

---

## 📢 Novidades & O que Acabamos de Resolver (WhatsApp)

1. **Reconexão do WhatsApp (Evolution API):**
   * **Problema:** O envio de mensagens automatizadas estava falhando com erro `Connection Closed` (500), embora a API respondesse com estado `"open"` (problema conhecido de "Falso Conectado").
   * **O que foi feito:**
     * Instruímos o usuário a desconectar aparelhos ativos diretamente no aplicativo móvel do WhatsApp (Aparelhos Conectados).
     * Forçamos a limpeza/logout na instância `Jon` e geramos um novo **QR Code**.
     * O usuário escaneou o QR Code, estabelecendo a conexão com sucesso.
     * Rodamos um script de teste em segundo plano (`scratch/wait_and_send.cjs`) que confirmou a conexão ativa (estado `"open"`) e realizou com sucesso o envio da mensagem solicitada para o número **(31) 99300-2887** (JID: `553193002887@s.whatsapp.net`).
   * **Status do WhatsApp:** 100% ativo e funcional no CRM.

2. **Atualização do Mapa de Localização (Google Maps Solutions):**
   * **O que foi feito:** Substituímos o iframe antigo de embed padrão do Google Maps pelo novo iframe interativo da solução de seleção de endereço da Google Cloud (`maps-solutions-alzpk61fzb`) no componente `src/components/NewDesignComponents.jsx` (ContactCTA).
   * **Status do Mapa:** 100% atualizado e testado no build de produção.

---

## 🛠️ Status do Redesign Obsidian Bronze (Admin)

De acordo com as diretrizes do redesign e o arquivo `PENDENCIAS.md`:
* **Progresso Geral:** ~95% concluído.
* **Problema Crítico Pendente:** A tela **`/admin/hoje`** está em branco (blank screen) em produção (`ojonquecortou.com.br/admin/hoje`).

### Prováveis Causas do Blank Screen:
1. Component lazy loading crashing silenciosamente (Suspense com fallback = `null`).
2. Erro específico no carregamento/inicialização de listeners do Firebase no component `AdminHoje.jsx` em ambiente de produção.
3. Rota ou Layout (`AdminLayout.jsx`) quebrados.

### Próximos Passos recomendados no Admin:
* Executar `npm run dev` localmente no diretório para debugar com hot-reload.
* Adicionar um `ErrorBoundary` em `AdminLayout.jsx`.
* Mudar o fallback do `Suspense` em `AdminLayout.jsx` de `null` para um Loader ou mensagem legível (e.g. `<div>Carregando painel...</div>`) para ver se a falha está no carregamento do bundle.
* Inspecionar o console do navegador (F12) ao acessar a rota para capturar o erro exato de JS.

---

## 📈 SEO & Sitemap (Últimos Commits)

Os últimos commits no repositório focaram em otimização de SEO e consolidação de metadados:
1. `e6aa35c` — `seo: adiciona LocalBusiness schema estruturado no index.html base`
2. `67cf41a` — `chore: merge branch main e resolve conflitos do sitemap`
3. `147cf02` — `seo: expande paginas de servico com conteudo tecnico aprofundado`
4. `d2fd868` — `chore: update generated sitemap and posts.json after SEO consolidation`

---

## 📂 Estrutura de Arquivos Úteis para Scripts e Testes
* `scratch/save_qr.cjs`: Obtém a string Base64 do QR code e salva localmente.
* `scratch/wait_and_send.cjs`: Loop de verificação de conexão + envio automático pós-conexão.
* `print_studio_settings.cjs`: Mostra as configurações e chaves da API do estúdio no Firestore.
* `read_automation_logs.cjs`: Script para visualizar logs de envio e notificações (requer autenticação nas regras do Firebase).
