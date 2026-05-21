import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.resolve(__dirname, '..', 'src');

const replacements = [
  [/\u00C3\u00A1/g, 'á'], // Ã¡
  [/\u00C3\u00A7/g, 'ç'], // Ã§
  [/\u00C3\u00A3/g, 'ã'], // Ã£
  [/\u00C3\u00B5/g, 'õ'], // Ãµ
  [/\u00C3\u00A0/g, 'à'], // Ã 
  [/\u00C3\u00AD/g, 'í'], // Ã­
  [/\u00C3\u00A9/g, 'é'], // Ã©
  [/\u00C3\u00B3/g, 'ó'], // Ã³
  [/\u00C3\u00AA/g, 'ê'], // Ãª
  [/\u00C3\u00BA/g, 'ú'], // Ãº
  [/\u00C3\u00B4/g, 'ô'], // Ã´
  [/\u00C3\u00A2/g, 'â'], // Ã¢
  [/\u00C3\u00AE/g, 'î'], // Ã®
];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      for (const [pattern, repl] of replacements) {
        if (pattern.test(content)) {
          content = content.replace(pattern, repl);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed encoding in: ${filePath}`);
      }
    }
  }
}

console.log(`Starting encoding cleanup in: ${baseDir}`);
walkDir(baseDir);
console.log('Encoding cleanup finished.');
