import { galleryImages } from '../data/galleryImages.js';

// Mapeamento de categorias e palavras-chave para conjuntos temáticos de imagens reais
const THEMATIC_SETS = {
  cortes: [
    '/cachos-curtos-definidos-bh.webp',
    '/corte-pixie-cacheado.webp',
    '/corte-crespo-com-volume.webp',
    '/cachos-medios-definidos.webp',
    '/cachos-medios-volumosos-bh.webp',
    '/cabelo-longo-ondulado-bh.webp',
    '/corte-curto-ondulado-jeans-bh.webp',
    '/corte-curto-grisalho.webp'
  ],
  coloracao: [
    '/cachos-longos-luzes.webp',
    '/cachos-ruivos-definicao.webp',
    '/cachos-longos-acobreados.webp',
    '/corte-ondulado-ruivo-bh.webp',
    '/coloracao-ruivo-cachos-explosao.webp',
    '/cachos-curtos-mechas-douradas.webp',
    '/cachos-masculino-luzes-mel-frente.webp'
  ],
  cuidados: [
    '/cachos-longos-castanhos-bh.webp',
    '/cachos-longos-sorriso-bh.webp',
    '/cachos-longos-castanhos-definidos.webp',
    '/cachos-escuros-sorridentes-estudio.webp',
    '/cachos-longos-castanhos-sorriso.webp',
    '/cachos-masculinos-longos.webp',
    '/cabelo-curto-platinado.webp'
  ]
};

// Gera um hash numérico simples a partir do slug para estabilidade determinística
function hashSlug(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Seleciona 2 a 3 imagens contextuais da galeria de acordo com o post.
 */
export function getContextualArticleImages(post) {
  const category = (post.category || '').toLowerCase();
  const slug = (post.slug || '').toLowerCase();
  const title = (post.title || '').toLowerCase();

  let preferredTheme = 'cuidados';
  if (
    category.includes('corte') ||
    slug.includes('corte') ||
    slug.includes('camada') ||
    slug.includes('cut') ||
    slug.includes('shag') ||
    slug.includes('pixie') ||
    slug.includes('volume') ||
    title.includes('corte')
  ) {
    preferredTheme = 'cortes';
  } else if (
    category.includes('cor') ||
    category.includes('color') ||
    slug.includes('luzes') ||
    slug.includes('morena') ||
    slug.includes('ruivo') ||
    slug.includes('loiro') ||
    slug.includes('color') ||
    title.includes('luzes') ||
    title.includes('iluminad')
  ) {
    preferredTheme = 'coloracao';
  }

  const primaryUrls = THEMATIC_SETS[preferredTheme];
  const secondaryTheme = preferredTheme === 'cortes' ? 'cuidados' : 'cortes';
  const secondaryUrls = THEMATIC_SETS[secondaryTheme];

  const seed = hashSlug(post.slug || 'post');
  const imgUrl1 = primaryUrls[seed % primaryUrls.length];
  const imgUrl2 = secondaryUrls[(seed + 3) % secondaryUrls.length];

  // Busca os metadados completos na lista oficial de fotos da galeria
  const findMeta = (url) => {
    const item = galleryImages.find((img) => img.url === url);
    return item || {
      url,
      title: 'Resultado Studio do Jon',
      description: 'Corte e tratamento técnico respeitando a curvatura natural.'
    };
  };

  return [findMeta(imgUrl1), findMeta(imgUrl2)];
}

/**
 * Injeta imagens reais de apoio no HTML do artigo com tags semânticas figure/figcaption,
 * lazy loading, decoding assíncrono e dimensões explícitas.
 */
export function injectArticleImages(contentHtml, post) {
  if (!contentHtml) return contentHtml;

  // Se já contém figuras de apoio, evita duplicação
  if (contentHtml.includes('class="post-inline-figure"') || contentHtml.includes('class="post-inline-img"')) {
    return contentHtml;
  }

  const images = getContextualArticleImages(post);
  if (!images || images.length === 0) return contentHtml;

  const paragraphs = contentHtml.split('</p>');
  if (paragraphs.length <= 4) {
    // Artigos curtos: adiciona uma imagem após o parágrafo 2
    const img1 = images[0];
    const fig1 = `
      <figure class="post-inline-figure">
        <img src="${img1.url}" alt="${img1.title} — ${img1.description} no Studio do Jon em Belo Horizonte" class="post-inline-img" loading="lazy" decoding="async" width="720" height="480" />
        <figcaption class="post-inline-caption"><strong>${img1.title}:</strong> ${img1.description}</figcaption>
      </figure>
    `;
    const p1 = paragraphs.slice(0, 2).join('</p>') + '</p>';
    const p2 = paragraphs.slice(2).join('</p>');
    return p1 + fig1 + p2;
  }

  // Ponto 1 de injeção: após o parágrafo 5 (após a introdução teórica)
  // Ponto 2 de injeção: após o parágrafo 9 ou cerca de 70% do artigo
  const idx1 = Math.min(5, Math.floor(paragraphs.length * 0.35));
  const idx2 = Math.min(Math.max(idx1 + 4, Math.floor(paragraphs.length * 0.7)), paragraphs.length - 2);

  const img1 = images[0];
  const fig1 = `
    <figure class="post-inline-figure">
      <img src="${img1.url}" alt="${img1.title} — ${img1.description} no Studio do Jon em Belo Horizonte" class="post-inline-img" loading="lazy" decoding="async" width="720" height="480" />
      <figcaption class="post-inline-caption"><strong>${img1.title}:</strong> ${img1.description}</figcaption>
    </figure>
  `;

  const img2 = images[1] || images[0];
  const fig2 = `
    <figure class="post-inline-figure">
      <img src="${img2.url}" alt="${img2.title} — ${img2.description} no Studio do Jon em Belo Horizonte" class="post-inline-img" loading="lazy" decoding="async" width="720" height="480" />
      <figcaption class="post-inline-caption"><strong>${img2.title}:</strong> ${img2.description}</figcaption>
    </figure>
  `;

  const part1 = paragraphs.slice(0, idx1).join('</p>') + '</p>';
  const part2 = paragraphs.slice(idx1, idx2).join('</p>') + '</p>';
  const part3 = paragraphs.slice(idx2).join('</p>');

  return part1 + fig1 + part2 + fig2 + part3;
}
