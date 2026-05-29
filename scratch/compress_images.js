import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = 'public';

async function compress() {
  const images = [
    {
      input: 'longo-cacheado-natural-bh.png',
      output: 'longo-cacheado-natural-bh.webp'
    },
    {
      input: 'especialista-em-cachos-curto-resultado.png',
      output: 'especialista-em-cachos-curto-resultado.webp'
    }
  ];

  for (const img of images) {
    const inputPath = path.join(publicDir, img.input);
    const outputPath = path.join(publicDir, img.output);

    if (fs.existsSync(inputPath)) {
      console.log(`Compressing ${img.input} to ${img.output}...`);
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      const oldSize = fs.statSync(inputPath).size;
      const newSize = fs.statSync(outputPath).size;
      console.log(`Original Size: ${(oldSize / 1024).toFixed(2)} KB`);
      console.log(`Compressed Size: ${(newSize / 1024).toFixed(2)} KB`);
      
      // Delete old file
      fs.unlinkSync(inputPath);
      console.log(`Deleted old file ${img.input}`);
    } else {
      console.log(`File not found: ${inputPath}`);
    }
  }
}

compress().catch(console.error);
