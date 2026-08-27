# Studio do Jon — Servidor MCP (Model Context Protocol) ✂️

Servidor MCP oficial para conectar os dados do CRM do **Studio do Jon** (`@ojonquecortou`) ao **Claude Code** e ao **Claude Desktop**.

---

## 🛠️ Ferramentas Disponíveis para o Claude

| Ferramenta | Descrição |
| :--- | :--- |
| `jon_obter_resumo_financeiro` | Retorna faturamento bruto, despesas, saldo líquido, faturamento por Pix/Cartão, ticket médio e quantidade de atendimentos. |
| `jon_listar_transacoes_financeiras` | Lista transações detalhadas com valores, clientes, categorias e formas de pagamento. |
| `jon_consultar_estoque` | Retorna o status de produtos (OK / Crítico / Zerado), preços de custo e venda, margens e valor total em estoque. |
| `jon_buscar_clientes` | Busca clientes por nome, telefone, curvatura capilar (2A a 4C) e dias sem visitar o estúdio (para reativação). |
| `jon_consultar_agenda` | Consulta a grade de agendamentos do dia ou período com serviços, valores e status. |
| `jon_catalogo_servicos` | Retorna a tabela completa de serviços do estúdio com preços e durações. |
| `jon_dashboard_geral` | Visão executiva 360º com KPIs do mês atual, alertas de estoque e clientes. |

---

## 🚀 Como Configurar no Claude Desktop

1. Abra o arquivo de configuração do Claude Desktop no seu Windows:
   `%APPDATA%\Claude\claude_desktop_config.json`
   *(Geralmente em: `C:\Users\SEU_USUARIO\AppData\Roaming\Claude\claude_desktop_config.json`)*

2. Adicione o servidor `jon-crm`:

```json
{
  "mcpServers": {
    "jon-crm": {
      "command": "node",
      "args": [
        "C:/Users/jonat/Documents/antigravity/proud-lovelace/mcp-server/index.js"
      ]
    }
  }
}
```

3. Reinicie o aplicativo **Claude Desktop**.
4. O ícone de ferramentas (martelo 🔨) aparecerá na barra de chat com todas as funções do Studio do Jon.

---

## 💻 Como Usar no Claude Code (Terminal)

Como o arquivo `.mcp.json` já está configurado na raiz do projeto, o **Claude Code** carrega o servidor automaticamente quando você executa comandos dentro da pasta.

Você também pode registrar globalmente com o comando:
```bash
claude mcp add jon-crm node C:/Users/jonat/Documents/antigravity/proud-lovelace/mcp-server/index.js
```

---

## 💬 Exemplos de Perguntas que você pode fazer ao Claude:

* *"Claude, quanto faturamos este mês no estúdio e qual foi o método de pagamento mais usado?"*
* *"Quais produtos de lavatório estão com estoque baixo ou zerados?"*
* *"Busque as clientes de cabelo crespo (tipo 4) que não cortam há mais de 90 dias para eu disparar uma mensagem."*
* *"Como está a agenda de agendamentos para hoje e amanhã?"*
* *"Qual é o nosso ticket médio atual e qual serviço traz mais receita?"*
