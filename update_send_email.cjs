const fs = require('fs');

let code = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/api/send-email.js', 'utf8');

const importStr = "import { EMAIL_CSS } from '../src/utils/emailTemplates.js';\n";
if (!code.includes('EMAIL_CSS')) {
  code = code.replace(/import nodemailer from 'nodemailer';/, "import nodemailer from 'nodemailer';\n" + importStr);
}

const standaloneWrapper = `
function getStandaloneWrapper(title, content) {
  return \`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title}</title>
  <style>\${EMAIL_CSS}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0eee9; -webkit-font-smoothing: antialiased;">
  \${content}
</body>
</html>
\`;
}
`;

if (!code.includes('getStandaloneWrapper')) {
  code = code.replace('function getEmailWrapper', standaloneWrapper + '\nfunction getEmailWrapper');
}

code = code.replace(
  /const finalHtml = type === 'campanha_raw' \? htmlBody : getEmailWrapper\(emailSubject, emailContent\);/g,
  "const finalHtml = type === 'campanha_raw' ? htmlBody : (type === 'campanha' ? getStandaloneWrapper(emailSubject, emailContent) : getEmailWrapper(emailSubject, emailContent));"
);

fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/api/send-email.js', code);
console.log("Updated send-email.js");
