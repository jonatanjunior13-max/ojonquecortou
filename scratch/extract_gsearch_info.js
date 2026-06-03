import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\jonat\\.gemini\\antigravity\\brain\\bd1a8beb-0ff0-4ea4-b9f8-fa4cc53a481c\\.system_generated\\steps\\4385\\content.md', 'utf8');

// Let's print snippets containing search results
console.log('File size:', content.length, 'bytes');

// Let's strip script tags and basic HTML boilerplate to see text content
const textContent = content
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

console.log('Text content preview (first 2000 chars):');
console.log(textContent.substring(0, 2000));

// Let's find occurrences of interesting terms
const terms = ['Jon', 'Cachos', 'Cabeleireiro', 'BH', 'Avaliação', 'Estrela', 'trinks', 'instagram', 'Facebook', 'site', 'telefone', 'endereço', 'Caiçara'];
terms.forEach(term => {
  const count = (textContent.match(new RegExp(term, 'gi')) || []).length;
  console.log(`Term "${term}": ${count} matches`);
});

// Write clean text content to a scratch file to examine it
fs.writeFileSync('C:\\Users\\jonat\\.gemini\\antigravity\\scratch\\gsearch_clean_text.txt', textContent, 'utf8');
console.log('Cleaned text saved to scratch/gsearch_clean_text.txt');
