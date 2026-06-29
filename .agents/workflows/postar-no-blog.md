---
description: Como postar um novo artigo no Blog do Jon
---

Para adicionar um novo post ao seu blog, siga estes passos simples no seu ambiente de desenvolvimento:

### 1. Preparar a Imagem
- Salve a imagem de capa na pasta `public/` do seu projeto. 
- Use nomes simples sem espaços (ex: `dica-cachos.jpg`).

### 2. Adicionar o Conteúdo
Abra o arquivo `src/data/posts.js` e adicione um novo objeto ao topo da lista (array), seguindo este modelo:

```javascript
  {
    id: 4, // Coloque o próximo número da sequência
    slug: 'titulo-do-seu-post', // Como aparecerá na URL (ex: d-novo-corte)
    title: 'Título do Seu Post Aqui',
    excerpt: 'Um resumo curto para aparecer na listagem.',
    date: '30 de Março, 2026', // Data de hoje
    author: 'Jon',
    category: 'Dicas', // Ou 'Técnica', 'Transição', etc.
    content: `
      <p>Seu texto aqui...</p>
      <h3>Subtítulo se precisar</h3>
      <p>Mais texto...</p>
    `,
    image: '/nome-da-sua-imagem.jpg' // O caminho da imagem que você salvou na pasta public
  },
```

### 3. Gerar o Build (obrigatório)

> [!IMPORTANT]
> Este passo é **obrigatório**. O Vercel serve um arquivo HTML pré-renderizado para cada post (`/blog/slug/index.html`). Se o build não rodar, o post fica com 404 e não aparece.

No terminal, dentro da pasta do projeto, execute:

```powershell
npm run build
```

Aguarde terminar. A saída vai confirmar algo como:
```
Starting Node SEO pre-rendering for XX pages...
Static pre-rendering completed successfully!
```

### 4. Publicar no ar

Após o build completar com sucesso, faça o commit e push:

```powershell
git add -A
git commit -m "feat: novo post - titulo-do-post"
git push
```

O Vercel detecta o push e faz o deploy automaticamente em ~2 minutos. Não use `npx vercel --prod` manualmente — o push já dispara o deploy pelo GitHub.

---

> [!TIP]
> **Dica de Formatação:** No campo `content`, você pode usar as tags `<h3>`, `<p>` e `<strong>` para deixar o texto bonito no blog.
> 
> **Quer que eu poste pra você?** Basta me enviar o texto e a foto aqui no chat que eu faço todo o processo, rodo o build e dou o push automaticamente!
