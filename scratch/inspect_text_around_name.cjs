const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

// Find occurrences of Nome (case-insensitive) in content00
const regex = /Nome/gi;
let match;
let count = 0;
console.log('=== Searches for "Nome" in 00 ===');
while ((match = regex.exec(content00)) !== null && count < 20) {
  count++;
  console.log(`Match ${count} at ${match.index}: "${content00.substring(match.index - 50, match.index + 50).replace(/\r?\n/g, ' ')}"`);
}

// Let's also check if there is '{' and '}' close to Nome
const bracketRegex = /\{[^{}]*nome[^{}]*\}/gi;
let bCount = 0;
console.log('\n=== Bracket searches in 00 ===');
while ((match = bracketRegex.exec(content00)) !== null) {
  bCount++;
  console.log(`Bracket Match ${bCount} at ${match.index}: "${match[0]}"`);
}

// Also check "Marina" in 06
const file06 = 'C:/Users/jonat/Downloads/06 _ Reativa_o (1).html';
const content06 = fs.readFileSync(file06, 'utf8');
const regex06 = /Marina/gi;
console.log('\n=== Searches for "Marina" in 06 ===');
while ((match = regex06.exec(content06)) !== null) {
  console.log(`Match at ${match.index}: "${content06.substring(match.index - 50, match.index + 50).replace(/\r?\n/g, ' ')}"`);
}
