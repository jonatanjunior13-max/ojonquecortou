const fs = require('fs');
const path = require('path');

const whitelist = new Set([
  'background', 'background-color', 'color', 
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'width', 'height', 'max-width', 'min-width', 'max-height', 'min-height',
  'border', 'border-radius', 'border-color', 'border-width', 'border-style', 
  'border-top', 'border-bottom', 'border-left', 'border-right',
  'display', 'flex-direction', 'align-items', 'justify-content', 'flex', 'flex-wrap',
  'box-sizing', 'text-align', 'text-decoration',
  'position', 'top', 'left', 'right', 'bottom',
  'opacity', 'vertical-align', 'list-style', 'line-break', 'white-space',
  'text-transform', 'flex-grow', 'flex-shrink', 'flex-basis', 'border-collapse',
  'box-shadow', 'cursor', 'word-break', 'overflow', 'text-overflow'
]);

function replaceLink(html, textSubstring, newUrl) {
  const regex = new RegExp(`(<a\\s+[^>]*href=")[^"]*("[^>]*>[\\s\\S]*?${textSubstring}[\\s\\S]*?<\\/a>)`, 'gi');
  return html.replace(regex, `$1${newUrl}$2`);
}

function processTemplate(filePath, title) {
  let html = fs.readFileSync(filePath, 'utf8');
  
  // 1. Extract mail-stage tag and inner mail-body
  const mailStageStart = html.indexOf('<div class="mail-stage');
  if (mailStageStart === -1) {
    throw new Error('No mail-stage found');
  }
  const mailStageTagEnd = html.indexOf('>', mailStageStart) + 1;
  const mailStageTag = html.substring(mailStageStart, mailStageTagEnd);
  
  const mailBodyStart = html.indexOf('class="mail-body');
  if (mailBodyStart === -1) {
    throw new Error('No mail-body found');
  }
  const divStart = html.lastIndexOf('<div', mailBodyStart);
  const bodyEnd = html.indexOf('</body>');
  if (bodyEnd === -1) {
    throw new Error('No </body> tag found');
  }
  
  let bodyContent = html.substring(divStart, bodyEnd).trim();
  // Close the two divs (mail-body and mail-stage) at the end
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*$/, '</div></div>');
  
  // 2. Clean element attributes
  // Strip data-om attributes
  bodyContent = bodyContent.replace(/\s*data-om-text="[^"]*"/g, '');
  bodyContent = bodyContent.replace(/\s*data-om-id="[^"]*"/g, '');
  
  // Whitelist styles
  const styleRegex = /style="([^"]*)"/gi;
  bodyContent = bodyContent.replace(styleRegex, (match, styleContent) => {
    const normalized = styleContent.replace(/&quot;/g, "'");
    const props = normalized.split(';');
    const cleaned = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return false;
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      return whitelist.has(key);
    });
    return `style="${cleaned.join('; ')}"`;
  });
  
  // Clean style on mailStageTag too
  const cleanMailStageTag = mailStageTag.replace(styleRegex, (match, styleContent) => {
    const normalized = styleContent.replace(/&quot;/g, "'");
    const props = normalized.split(';');
    const cleaned = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return false;
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      return whitelist.has(key);
    });
    return `style="${cleaned.join('; ')}"`;
  });

  // Assemble HTML
  const fontsImport = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Manrope:wght@300;400;500;600;700;800&display=swap');`;
  
  let finalHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${fontsImport}</style>
</head>
<body style="margin:0">
${cleanMailStageTag}
${bodyContent}
</body>
</html>`;

  // 3. Personalization / replaces
  // Replace Name: split tags in 00
  const nameRegex = /\{\s*<\/span>\s*<span[^>]*>\s*Nome\s*<\/span>\s*<span[^>]*>\s*\}/gi;
  finalHtml = finalHtml.replace(nameRegex, '{nome}');
  
  // Other placeholders
  finalHtml = finalHtml.replace(/Terça, 18 de Junho/g, '{data}');
  finalHtml = finalHtml.replace(/14h00/g, '{horario}');
  finalHtml = finalHtml.replace(/Corte \+ leitura de fio/g, '{servico}');
  
  // Address
  finalHtml = finalHtml.replace(/Rua dos Cacheados, 218 · Caiçara · Belo Horizonte/g, 'Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte');
  finalHtml = finalHtml.replace(/Rua dos Cacheados, 218 · Caiçara/g, 'Rua Francisco Ovídio, 184 · Caiçara');
  finalHtml = finalHtml.replace(/Rua dos Cacheados, 218/g, 'Rua Francisco Ovídio, 184');

  // Links
  finalHtml = replaceLink(finalHtml, "Falar com o Jon no WhatsApp", "https://wa.me/553135866673");
  finalHtml = replaceLink(finalHtml, "Sugerir outro horário", "https://www.ojonquecortou.com.br/agendar");
  finalHtml = replaceLink(finalHtml, "Instagram ↗", "https://instagram.com/ojonquecortou");
  finalHtml = replaceLink(finalHtml, "WhatsApp ↗", "https://wa.me/553135866673");
  finalHtml = replaceLink(finalHtml, "Google Maps ↗", "https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte");
  finalHtml = replaceLink(finalHtml, "Blog ↗", "https://www.ojonquecortou.com.br/blog");
  finalHtml = replaceLink(finalHtml, "Descadastrar", "https://ojonquecortou.com.br/api/unsubscribe?email={email}");
  finalHtml = replaceLink(finalHtml, "Preferências", "https://www.ojonquecortou.com.br");

  return finalHtml;
}

const cleanedHtml = processTemplate('C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html', 'Pedido recebido');
console.log('Cleaned length:', cleanedHtml.length, 'bytes');
console.log('\n--- Start of Cleaned HTML ---');
console.log(cleanedHtml.substring(0, 1000));
console.log('\n--- End of Cleaned HTML ---');
console.log(cleanedHtml.substring(cleanedHtml.length - 800));
