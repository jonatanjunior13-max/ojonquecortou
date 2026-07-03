# Semantic Content Cluster Audit — ojonquecortou.com.br/blog
Date: 2026-07-03
Scope: 47 published /blog/ posts (from sitemap.xml) + /metodo, /glossario, /servicos/* as potential hubs

## Method
- Full URL list pulled from sitemap.xml
- Slug/title semantic grouping into topic clusters
- Spot-check WebFetch on representative posts per cluster (frizz cluster x3, transição x1, cortes/tendências x2, porosidade x1, hubs x2)
- Note: site is a JS-rendered React app; WebFetch's HTML→text conversion surfaced the site-wide blog index/nav block on every page rather than isolating in-article prose links, so inline contextual link counts below are inferred from hub page structure + could not be fully verified per-post. This is flagged as a data-gap, not a false negative.

## Cluster Map (7 clusters + orphans)

### Cluster A — Cronograma Capilar / Rotina (hub candidate: cronograma-capilar-cabelo-cacheado)
- cronograma-capilar-cabelo-cacheado (PILLAR — merged target, absorbed rotina-basica via 301, fixed 2026-07-02)
- excesso-hidratacao-cronograma-capilar-cacheado (spoke — specific failure mode within cronograma)
- rotina-minimalista-cabelos-cacheados (spoke — adjacent but distinct: "minimal routine" vs "full schedule")
- finalizacao-por-curvatura-guia-tecnico (spoke — styling step within routine)
- fim-do-bad-hair-day-after / day-after-cabelo-cacheado-bh-como-reativar-sem-lavar (near-duplicate pair, see Finding 2)

### Cluster B — Frizz (hub candidate: none formal — should be frizz-em-cabelo-cacheado)
- frizz-em-cabelo-cacheado ("physics of frizz" — most foundational/informational)
- guia-sobrevivencia-frizz-bh (BH-localized, commercial-leaning)
- cabelo-cacheado-inverno-bh-frizz-ressecamento (seasonal + BH + frizz)
- frizz-normal-ou-dano-capilar (diagnostic angle: frizz vs damage)
- voce-tem-cabelo-ondulado-e-nao-sabe-liso-com-frizz (wavy-hair-misdiagnosis angle)
See Finding 1 — 5 posts, high topical overlap, no clear pillar declared.

### Cluster C — Transição Capilar (hub candidate: /servicos/transicao-capilar)
- transicao-capilar-sem-sofrimento-guia-cachos (broad/informational)
- transicao-capilar-bh-danos-botox (BH + chemical damage angle)
- transicao-capilar-bh-corte-seco (BH + dry-cut technique angle)
See Finding 3 — 3 posts all BH-localized variants of the same intent with no visible pillar cross-linking hierarchy.

### Cluster D — Porosidade / pH / Acidificação (hub candidate: none formal)
- teste-de-porosidade-guia-definitivo
- ph-capilar-cachos-brilho-definicao
- acidificacao-capilar-cachos-porosidade
- cabelo-poroso-nao-absorve-creme-scab-hair
- cabelo-cacheado-ressecado-porosidade
5 posts, technically differentiated (test vs pH vs acidification vs absorption vs dryness) but zero pillar to unify them.

### Cluster E — Cortes / Tendências (hub candidates: /metodo, /servicos/corte-hibrido, /servicos/corte-jon)
- corte-hibrido-cabelo-cacheado
- shaggy-cacheado-corte-seco
- wolf-cut-cabelos-cacheados-tendencia
- shag-cacheado-corte-tendencia-2026
- corte-para-cabelo-cacheado-mentira-do-corte-a-seco
- corte-a-seco-cabelo-cacheado-bh-volume
- corte-para-cabelo-cacheado-bh-volume
- frequencia-de-corte-cabelo-cacheado
- corte-cabelo-cacheado-visagismo-influenciadora
See Finding 4 (wolf cut vs shag) and Finding 5 (corte-a-seco-bh-volume vs corte-cabelo-cacheado-bh-volume).

### Cluster F — Produtos / Ingredientes
- guia-completo-produtos-cabelo-cacheado-2026 (pillar candidate)
- oleo-de-coco-no-cabelo-cacheado-resseca
- sulfato-no-shampoo-guia-completo
- botox-capilar-cabelo-cacheado-perigos

### Cluster G — Curl-type / Diagnóstico
- cacho-vs-crespo-qual-diferenca
- curvatura-4c-cabelo-crespo-guia-completo
- fator-encolhimento-cabelo-cacheado
- secagem-cachos-difusor-vs-natural
- cabelo-cacheado-embaraca-muito

### Cluster H — BH Local/Trust/Conversion (bridge content)
- especialista-em-cabelo-cacheado-bh-texturas
- cabeleireiro-especialista-em-cachos-belo-horizonte-descolorido
- cabelo-bonito-no-salao-diferente-em-casa
- por-que-saloes-falham-cabelo-texturizado
- 3-erros-fatais-que-destroem-cabelos-cacheados-e-crespos
- leitura-de-fio-metodo-exclusivo-studio-do-jon (should link directly to /metodo and /servicos/leitura-de-fio)
- alforria-do-cacho-liberdade-2026
- caspa-cabelo-cacheado-inverno-como-tratar
- melhores-cortes-cabelo-cacheado-masculino-2026 (bridges to /servicos/masculino)
- penteados-cabelo-cacheado

## Hub-and-Spoke Assessment
/metodo and /glossario both render as large indexes linking OUT to ~30-50 blog posts each (confirmed via fetch) — they function as **directory hubs**, not curated topical pillars. Neither page groups posts by cluster/topic with contextual framing; both appear to be flat alphabetical/chronological lists. No cluster (frizz, porosidade, transição, cortes) has a dedicated pillar page that (a) targets the head keyword, (b) is linked FROM every spoke in that cluster, and (c) links back to all spokes with topical framing. This is the single biggest structural gap.

## Gaps Identified
1. No pillar page for "frizz em cabelo cacheado" as a category (5 posts, no hub)
2. No pillar page for "porosidade capilar" as a category (5 posts, no hub)
3. No pillar page for "cortes/tendências cacheado" (9 posts, no hub — /metodo is method-focused, not cut-trend-focused)
4. Transactional bridge gap: informational clusters (frizz, porosidade, transição) do not consistently link to matching /servicos/* pages (e.g., /servicos/transicao-capilar, /servicos/protocolo-blindagem-ph-reconstrucao, /servicos/infusao-carga-hidrica-porosos) — these service pages exist but their blog-content on-ramp is unclear from available data.
