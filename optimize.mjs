import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = './public';
const files = fs.readdirSync(dir);

async function processImages() {
  for (const file of files) {
    if ((file.startsWith('blog-') || file === 'infografico.png') && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Converte tudo para webp
      const newFileName = file.replace(/\.(png|jpe?g)$/i, '.webp');
      const newFilePath = path.join(dir, newFileName);
      
      try {
        await sharp(filePath)
          .resize(1000, null, { withoutEnlargement: true }) // Reduz largura para no máximo 1000px
          .webp({ quality: 75 }) // Converte para WebP com boa qualidade
          .toFile(newFilePath);
          
        console.log(`Convertido: ${file} (${(stat.size / 1024 / 1024).toFixed(2)}MB) -> ${newFileName}`);
        
        // Remove arquivo antigo
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Erro ao processar ${file}:`, err);
      }
    }
  }
}

processImages();
