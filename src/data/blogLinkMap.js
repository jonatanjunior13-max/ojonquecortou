// Blog-to-blog link map for GEO. Each entry: source post should link to target post when anchor text appears in content.
// Safe: applied at render-time via utility, no modification to posts.js needed.

export const blogLinkMap = [
  // Porosidade cluster
  { source: 'frizz-em-cabelo-cacheado', target: 'teste-de-porosidade-guia-definitivo', anchor: 'porosidade capilar' },
  { source: 'teste-de-porosidade-guia-definitivo', target: 'frizz-em-cabelo-cacheado', anchor: 'frizz' },
  { source: 'teste-de-porosidade-guia-definitivo', target: 'cronograma-capilar-cabelo-cacheado', anchor: 'cronograma capilar' },
  { source: 'acidificacao-capilar-cachos-porosidade', target: 'teste-de-porosidade-guia-definitivo', anchor: 'teste de porosidade' },
  { source: 'acidificacao-capilar-cachos-porosidade', target: 'frizz-em-cabelo-cacheado', anchor: 'controle de frizz' },
  { source: 'cabelo-cacheado-ressecado-porosidade', target: 'teste-de-porosidade-guia-definitivo', anchor: 'diagnóstico de porosidade' },
  { source: 'cabelo-cacheado-ressecado-porosidade', target: 'acidificacao-capilar-cachos-porosidade', anchor: 'acidificação' },

  // Cronograma cluster
  { source: 'cronograma-capilar-cabelo-cacheado', target: 'excesso-hidratacao-cronograma-capilar-cacheado', anchor: 'excesso de hidratação' },
  { source: 'cronograma-capilar-cabelo-cacheado', target: 'teste-de-porosidade-guia-definitivo', anchor: 'nível de porosidade' },
  { source: 'excesso-hidratacao-cronograma-capilar-cacheado', target: 'cronograma-capilar-cabelo-cacheado', anchor: 'cronograma científico' },
  { source: 'rotina-minimalista-cabelos-cacheados', target: 'cronograma-capilar-cabelo-cacheado', anchor: 'rotina básica' },
  { source: 'guia-completo-produtos-cabelo-cacheado-2026', target: 'cronograma-capilar-cabelo-cacheado', anchor: 'cronograma capilar' },

  // Leitura de Fio hub
  { source: '3-erros-fatais-que-destroem-cabelos-cacheados-e-crespos', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'diagnóstico especializado' },
  { source: 'excesso-hidratacao-cronograma-capilar-cacheado', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'Método Leitura de Fio' },
  { source: 'corte-a-seco-cabelo-cacheado-bh-volume', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'método de diagnóstico' },
  { source: 'transicao-capilar-bh-corte-seco', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'diagnóstico de transição' },
  { source: 'curvatura-4c-cabelo-crespo-guia-completo', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'Método Leitura de Fio' },

  // Corte cluster
  { source: '3-erros-fatais-que-destroem-cabelos-cacheados-e-crespos', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'corte a seco' },
  { source: 'corte-a-seco-cabelo-cacheado-bh-volume', target: 'frequencia-de-corte-cabelo-cacheado', anchor: 'frequência de corte' },
  { source: 'corte-hibrido-cabelo-cacheado', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'técnica de corte a seco' },
  { source: 'corte-para-cabelo-cacheado-mentira-do-corte-a-seco', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'corte a seco' },
  { source: 'frequencia-de-corte-cabelo-cacheado', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'corte a seco' },
  { source: 'fator-encolhimento-cabelo-cacheado-fisica-geometria', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'corte a seco' },
  { source: 'transicao-capilar-bh-corte-seco', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'corte estratégico' },

  // Day-after / secagem cluster
  { source: 'day-after-cabelo-cacheado-bh-como-reativar-sem-lavar', target: 'secagem-cachos-difusor-vs-natural', anchor: 'secagem com difusor' },
  { source: 'secagem-cachos-difusor-vs-natural', target: 'day-after-cabelo-cacheado-bh-como-reativar-sem-lavar', anchor: 'reativação de cachos' },

  // Transição cluster
  { source: 'transicao-capilar-sem-sofrimento-guia-cachos', target: 'transicao-capilar-bh-corte-seco', anchor: 'roteiro de corte' },
  { source: 'transicao-capilar-bh-danos-botox', target: 'transicao-capilar-bh-corte-seco', anchor: 'transição capilar' },

  // Curvatura cluster
  { source: 'curvatura-4c-cabelo-crespo-guia-completo', target: 'teste-de-porosidade-guia-definitivo', anchor: 'teste de porosidade' },
  { source: 'cacho-vs-crespo-qual-diferenca', target: 'curvatura-4c-cabelo-crespo-guia-completo', anchor: 'cabelo crespo 4C' },
  { source: 'guia-completo-produtos-cabelo-cacheado-2026', target: 'teste-de-porosidade-guia-definitivo', anchor: 'análise de porosidade' },

  // pH cluster
  { source: 'ph-capilar-cachos-brilho-definicao', target: 'acidificacao-capilar-cachos-porosidade', anchor: 'acidificação' },

  // Frizz types
  { source: 'frizz-normal-ou-dano-capilar', target: 'frizz-em-cabelo-cacheado', anchor: 'física do frizz' },

  // Fadiga Higral cluster
  { source: 'fadiga-higral-cabelo-cacheado-crespo-sintomas-tratamento', target: 'acidificacao-capilar-cachos-porosidade', anchor: 'acidificação capilar' },
  { source: 'fadiga-higral-cabelo-cacheado-crespo-sintomas-tratamento', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'Método Leitura de Fio' },
  { source: 'excesso-hidratacao-cronograma-capilar-cacheado', target: 'fadiga-higral-cabelo-cacheado-crespo-sintomas-tratamento', anchor: 'fadiga higral' },

  // Peptídeos Biomiméticos cluster
  { source: 'peptideos-biomimeticos-cabelo-cacheado-crespo-biotecnologia', target: 'descoloracao-cabelo-cacheado-pontes-dissulfeto-luzes', anchor: 'descoloração' },
  { source: 'peptideos-biomimeticos-cabelo-cacheado-crespo-biotecnologia', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'Método Leitura de Fio' },
  { source: 'descoloracao-cabelo-cacheado-pontes-dissulfeto-luzes', target: 'peptideos-biomimeticos-cabelo-cacheado-crespo-biotecnologia', anchor: 'peptídeos biomiméticos' },

  // Franja e Visagismo cluster
  { source: 'franja-cabelo-cacheado-crespo-visagismo-corte-seco', target: 'fator-encolhimento-cabelo-cacheado-fisica-geometria', anchor: 'fator encolhimento' },
  { source: 'franja-cabelo-cacheado-crespo-visagismo-corte-seco', target: 'corte-a-seco-cabelo-cacheado-bh-volume', anchor: 'corte a seco' },
  { source: 'franja-cabelo-cacheado-crespo-visagismo-corte-seco', target: 'leitura-de-fio-metodo-exclusivo-studio-do-jon', anchor: 'Método Leitura de Fio' },
  { source: 'corte-a-seco-cabelo-cacheado-bh-volume', target: 'franja-cabelo-cacheado-crespo-visagismo-corte-seco', anchor: 'franja cacheada' },
  { source: 'corte-borboleta-cabelo-ondulado-cacheado-visagismo', target: 'franja-cabelo-cacheado-crespo-visagismo-corte-seco', anchor: 'franja' },
];

// Utility to inject links into HTML content
export const injectBlogLinks = (htmlContent, currentSlug) => {
  let result = htmlContent;

  // Get links relevant to this post
  const relevantLinks = blogLinkMap.filter(link => link.source === currentSlug);

  relevantLinks.forEach(({ target, anchor }) => {
    // Only replace if not already linked
    if (!result.includes(`href="/blog/${target}"`)) {
      // Case-insensitive search for anchor text, but preserve original case in output
      const regex = new RegExp(`\\b${anchor.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi');
      result = result.replace(regex, match => `<a href="/blog/${target}">${match}</a>`);
    }
  });

  return result;
};
