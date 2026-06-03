import fs from 'fs';
const content = fs.readFileSync('C:\\Users\\jonat\\.gemini\\antigravity\\brain\\bd1a8beb-0ff0-4ea4-b9f8-fa4cc53a481c\\.system_generated\\steps\\4334\\content.md', 'utf8');
console.log('Does content contain "leitura-de-fio"?', content.includes('leitura-de-fio'));
console.log('Does content contain "leitura-de-fio-metodo-exclusivo-studio-do-jon"?', content.includes('leitura-de-fio-metodo-exclusivo-studio-do-jon'));
