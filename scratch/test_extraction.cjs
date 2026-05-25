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
  let html = fs.readFileSync(filePath, 'utf8');
  
  const mailStageStart = html.indexOf('<div class="mail-stage');
  const mailStageTagEnd = html.indexOf('>', mailStageStart) + 1;
  const mailStageTag = html.substring(mailStageStart, mailStageTagEnd);
  
  const mailBodyStart = html.indexOf('class="mail-body');
  // Find the <div that has class="mail-body
  const divStart = html.lastIndexOf('<div', mailBodyStart);
  
  const bodyEnd = html.indexOf('</body>');
  
  let bodyContent = html.substring(divStart, bodyEnd).trim();
  
  // Replace the three closing divs at the end with two closing divs
  // Let's verify how it ends
  const endingSnippet = bodyContent.substring(bodyContent.length - 100);
  console.log(`=== File: ${f.name} ===`);
  console.log(`mailStageStart: ${mailStageStart}`);
  console.log(`mailStageTag: ${mailStageTag.substring(0, 100)}...`);
  console.log(`divStart of mail-body: ${divStart}`);
  console.log(`Ending snippet of bodyContent before replacement:\n"${endingSnippet}"`);
  
  // Perform replacement of closing divs
  // Let's count matches of </div> at the end
  const cleanBodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*$/, '</div></div>');
  console.log(`New ending snippet:\n"${cleanBodyContent.substring(cleanBodyContent.length - 60)}"\n`);
});
