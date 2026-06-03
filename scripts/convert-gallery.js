import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

// List of specific gallery images to convert to avoid bloated script run
const galleryFiles = [
  'cachos-masculinos-longos.png',
  'cabelo-curto-platinado.png',
  'cachos-ruivos-definicao.png',
  'corte-crespo-com-volume.jpg',
  'cachos-longos-acobreados.jpg',
  'cachos-longos-luzes.jpg',
  'cachos-longos-sorriso-bh.png',
  'cachos-medios-definidos.png',
  'corte-pixie-cacheado.png',
  'corte-curto-grisalho.png',
  'cachos-curtos-definidos-bh.png',
  'cachos-longos-castanhos-bh.png',
  'corte-ondulado-ruivo-bh.png',
  'cabelo-longo-ondulado-bh.png',
  'cachos-medios-volumosos-bh.png',
  'cachos-masculino-luzes-mel-frente.jpg',
  'cachos-masculino-undercut-lateral.jpg',
  'coloracao-ruivo-cachos-explosao.jpg',
  'cachos-longos-castanhos-definidos.jpg',
  'cachos-escuros-sorridentes-estudio.jpg',
  'cachos-longos-castanhos-sorriso.jpg',
  'cachos-infantil-definidos-estudio.jpg',
  'corte-curto-ondulado-jeans-bh.jpg',
  'cachos-curtos-mechas-douradas.jpg',
  'corte-curto-cacheado-feminino-visagismo.png',
  'curto-cacheado-ruivo-estilo-bh.png',
  'corte-moderno-cabelo-ondulado-curto.png',
  'corte-masculino-cacheado-bh-resultado.png',
  'definicao-extrema-cachos-longos-bh.png',
  'corte-visagista-cachos-bh.png',
  'mechas-vermelhas-cabelo-curto-cacheado.png',
  'volume-afro-crespo-bh.jpg',
  'cabelo-ondulado-ruivo-especialista.png',
  'cabelo-cacheado-longo-definicao-bh.jpg',
  'mechas-em-cabelo-cacheado-visagismo-bh.jpg',
  'resultado-mechas-cachos-definidos.jpg',
  'corte-curto-cacheado-com-mechas-bh.jpg',
  'corte-masculino-cachos-com-luzes-bh.jpg',
  'coloracao-cachos-vermelhos-especialista.jpg',
  'volume-cabelo-crespo-vermelho-resultado.jpg',
  'corte-curto-cacheado-feminino-bh.jpg',
  'corte-a-seco-cachos-definidos-bh.jpg',
  'especialista-em-cabelo-cacheado-resultado.jpg',
  'corte-masculino-crespo-estilizado-bh.png',
  'visagismo-cabelo-cacheado-grisalho.jpg',
  'finalizacao-cachos-ondulados-bh.jpg',
  'jon-perfil.png',
  'jon-perfil.jpg',
  'jon-trabalhando.jpg',
  'shaggy-cacheado-capa.png',
  'shaggy-tecnico-seco.png',
  'cacho-vs-crespo-hero.png',
  'crespo-dense-volume.png',
  'mixed-curls-volume.png',
  'blog-secagem-hero.png',
  'blog-produtos-hero.png',
  'blog-produtos-aplicacao.png',
  'blog-produtos-resultado.png',
  'rotina-cachos-hero.png',
  'cronograma-semanal-cachos.png',
  'aplicacao-produtos-cachos.png',
  'blog-penteados-cacheado-capa.png',
  'blog-penteados-cacheado-comparativo.png',
  'blog-penteados-cacheado-tipos.png'
];

async function convert() {
  console.log('Starting image conversion to WebP...');

  for (const filename of galleryFiles) {
    const inputPath = path.join(publicDir, filename);
    const baseName = path.parse(filename).name;
    const outputPath = path.join(publicDir, `${baseName}.webp`);

    if (!fs.existsSync(inputPath)) {
      console.warn(`File not found, skipping: ${filename}`);
      continue;
    }

    try {
      const metadata = await sharp(inputPath).metadata();
      
      // Let's resize large pictures to maximum 1200px width/height to save more space, keeping aspect ratio
      let sharpInstance = sharp(inputPath);
      if (metadata.width > 1200 || metadata.height > 1200) {
        sharpInstance = sharpInstance.resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      await sharpInstance
        .webp({ quality: 80 })
        .toFile(outputPath);

      const inputStats = fs.statSync(inputPath);
      const outputStats = fs.statSync(outputPath);
      const percentReduced = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1);

      console.log(`✓ Converted ${filename} -> ${baseName}.webp (${(inputStats.size / 1024).toFixed(0)}KB -> ${(outputStats.size / 1024).toFixed(0)}KB, -${percentReduced}%)`);
    } catch (err) {
      console.error(`✗ Error converting ${filename}:`, err);
    }
  }

  console.log('Image conversion complete!');
}

convert().catch(console.error);
