const fs = require('fs');
const path = require('path');

const files = [
  { name: '00 _ Pedido recebido _ aguardando.html', key: 'solicitacao_recebida' },
  { name: '01 _ Confirma_o (1).html', key: 'horario_confirmado' },
  { name: '02 _ Lembrete 24h _ dark (1).html', key: 'lembrete_24h' },
  { name: '06 _ Reativa_o (1).html', key: 'reativacao_5_meses' }
];

files.forEach(f => {
  const filePath = path.join('C:/Users/jonat/Downloads', f.name);
  if (!fs.existsSync(filePath)) {
    console.log(`Not found: ${f.name}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n========================================`);
  console.log(`=== File: ${f.name} ===`);
  console.log(`========================================`);
  
  // Search for Marina
  const marinaRegex = /Marina/gi;
  let match;
  let count = 0;
  while ((match = marinaRegex.exec(content)) !== null && count < 10) {
    count++;
    console.log(`Found "Marina" at index ${match.index}: "${content.substring(match.index - 30, match.index + 30).replace(/\r?\n/g, ' ')}"`);
  }
  console.log(`Total "Marina" occurrences: ${count}`);

  // Search for {Nome} or { Nome }
  const tagRegex = /\{[^}]*Nome[^}]*\}/gi;
  let tagCount = 0;
  while ((match = tagRegex.exec(content)) !== null) {
    tagCount++;
    console.log(`Found name tag "${match[0]}" at index ${match.index}`);
  }

  // Search for dates
  const dateRegex = /18 de Junho|18\/Jun/gi;
  let dateCount = 0;
  while ((match = dateRegex.exec(content)) !== null) {
    dateCount++;
    console.log(`Found Date match "${match[0]}" at index ${match.index}: "${content.substring(match.index - 35, match.index + 35).replace(/\r?\n/g, ' ')}"`);
  }

  // Search for times
  const timeRegex = /14h00|14h/gi;
  let timeCount = 0;
  while ((match = timeRegex.exec(content)) !== null && timeCount < 10) {
    timeCount++;
    console.log(`Found Time match "${match[0]}" at index ${match.index}: "${content.substring(match.index - 35, match.index + 35).replace(/\r?\n/g, ' ')}"`);
  }

  // Search for services
  const svcRegex = /Corte \+ leitura de fio/gi;
  let svcCount = 0;
  while ((match = svcRegex.exec(content)) !== null) {
    svcCount++;
    console.log(`Found Service match "${match[0]}" at index ${match.index}`);
  }
});
