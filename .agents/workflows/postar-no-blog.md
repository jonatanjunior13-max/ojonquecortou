---
description: Como postar um novo artigo no Blog do Jon — processo completo e à prova de bugs
---

# Workflow: Postar no Blog do Jon

> [!IMPORTANT]
> **Siga os passos na ordem exata.** Pular qualquer etapa causa bugs conhecidos: post sumindo, 404 na URL, imagem quebrada.

---

## Passo 1 — Escolher o tema e o próximo ID

Verifique qual é o próximo ID disponível:

```powershell
node -e "const {posts} = require('./src/data/posts.js'); console.log('Próximo ID:', Math.max(...posts.map(p=>p.id)) + 1);"
```

Escolha um tema que:
- Seja técnico e relevante para cabelos ondulados, cacheados ou crespos
- Não repita um slug que já existe na lista
- **Não trate sobre corte a seco** (tema encerrado)

---

## Passo 2 — Gerar a imagem de capa

Use a ferramenta `generate_image` para criar uma imagem editorial de qualidade.

**Padrão de nome do arquivo:** `blog-[slug-do-post].webp`  
Exemplo: `blog-frizz-em-cabelo-cacheado.webp`

Após gerar, copie a imagem para a pasta `public/`:

```powershell
Copy-Item "CAMINHO_DA_IMAGEM_GERADA" "public\blog-[slug-do-post].webp" -Force
```

O campo `image` no post deve ser: `'/blog-[slug-do-post].webp'`

> [!CAUTION]
> **Nunca referencie uma imagem no post sem antes copiá-la para `public/`.** Se a imagem não existir, o card do blog fica quebrado visualmente.

---

## Passo 3 — Adicionar o post em `src/data/posts.js`

Abra o arquivo [`src/data/posts.js`](file:///c:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/data/posts.js) e insira o novo objeto **no topo do array** (antes do primeiro post existente), seguindo este modelo completo:

```javascript
{
  id: 48,                                    // próximo número da sequência
  slug: 'slug-do-post',                      // igual ao nome da imagem sem /blog- e sem .webp
  title: 'Título completo do post',
  seoTitle: 'Título completo do post | Studio do Jon',
  excerpt: 'Resumo de 1-2 frases para aparecer nos cards da listagem.',
  metaDescription: 'Meta description SEO com até 160 caracteres.',
  keywords: 'palavra-chave principal, variação 1, variação 2, Studio do Jon BH',
  date: '29 de Junho, 2026',
  datePublished: '2026-06-29',
  dateModified: '2026-06-29',
  author: 'Jon',
  category: 'Cuidado Capilar',              // ou 'Corte', 'Transição', 'Técnica'
  image: '/blog-slug-do-post.webp',
  faqSchema: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Pergunta 1?",
        "acceptedAnswer": { "@type": "Answer", "text": "Resposta 1." }
      },
      {
        "@type": "Question",
        "name": "Pergunta 2?",
        "acceptedAnswer": { "@type": "Answer", "text": "Resposta 2." }
      }
    ]
  },
  content: `
    <p>Parágrafo de abertura...</p>

    <h2>Subtítulo 1</h2>
    <p>Desenvolvimento...</p>

    <h2>Subtítulo 2</h2>
    <p>Desenvolvimento...</p>

    <h2>Perguntas Frequentes</h2>
    <h3>Pergunta 1?</h3>
    <p>Resposta 1.</p>
    <h3>Pergunta 2?</h3>
    <p>Resposta 2.</p>

    <div style="text-align: center; margin-top: 2rem; margin-bottom: 2rem; padding: 2rem; border-radius: 8px; background-color: var(--color-surface-light, rgba(255,255,255,0.05));">
      <h3>Quer resolver isso de vez?</h3>
      <p>Diagnóstico técnico e corte geométrico no Studio do Jon, em Belo Horizonte.</p>
      <a href="/agendar" class="btn btn-primary" style="padding: 1.25rem 2.5rem; display: inline-block; font-weight: 800; margin-top: 1rem; text-decoration: none;">Agendar Horário no Studio do Jon</a>
    </div>
  `
},
```

> [!WARNING]
> **Regras obrigatórias para não dar bug:**
> - O `slug` deve ser único — jamais repita um já existente
> - O `slug` do post deve ser idêntico ao nome da imagem: `blog-[slug].webp`
> - O `id` deve ser o próximo número da sequência (sem pular, sem repetir)
> - Nenhum campo obrigatório pode ficar `undefined` ou em branco

---

## Passo 4 — Rodar o build completo

> [!IMPORTANT]
> **Obrigatório.** O Vercel serve um HTML pré-renderizado para cada URL de post (`/blog/slug/index.html`). Se esse arquivo não existir, o post retorna 404 e nunca abre. O build gera esses arquivos.

```powershell
npm run build
```

Aguarde a conclusão. A saída deve conter:

```
Starting Node SEO pre-rendering for XX pages...
Static pre-rendering completed successfully!
posts.json generated and updated successfully in public/ and dist/!
```

Se aparecer `error` ou `failed`, **não faça o push** — resolva o erro primeiro.

---

## Passo 5 — Verificar que o HTML foi gerado

Confirme que o arquivo do novo post foi criado:

```powershell
Test-Path "dist\blog\[slug-do-post]\index.html"
```

Deve retornar `True`. Se retornar `False`, o prerender não incluiu o post — verifique se o slug no `posts.js` está correto e rode o build novamente.

---

## Passo 6 — Commit e push

```powershell
git add -A
git commit -m "feat: novo post - [slug-do-post]"
git push
```

O Vercel detecta o push e faz o deploy automaticamente em ~2 minutos. **Não use `npx vercel --prod`** — o push via GitHub já dispara o deploy.

---

## Passo 7 — Validar no ar

Após o deploy (~2 min), acesse:
- `https://www.ojonquecortou.com.br/blog` → o novo card deve aparecer no topo
- `https://www.ojonquecortou.com.br/blog/[slug-do-post]` → a página do post deve abrir

Se o post sumir após aparecer: limpe o `sessionStorage` do navegador (F12 → Application → Session Storage → limpar) e recarregue.

---

> [!TIP]
> **Quer que eu faça tudo isso por você?** Basta pedir o tema aqui no chat. Eu escrevo o post completo, gero a imagem, rodo o build e dou o push — tudo automaticamente.
