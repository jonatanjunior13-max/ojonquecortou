const fs = require('fs');

let code = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/pages/admin/AdminMarketing.jsx', 'utf8');

const importStr = "import { HTML_TEMPLATES, EMAIL_CSS } from '../../utils/emailTemplates.js';\n";
if (!code.includes('HTML_TEMPLATES')) {
  code = code.replace(/import '\.\/Admin\.css';/, "import './Admin.css';\n" + importStr);
}

const newPreviews = `
const EMAIL_PREVIEWS = {
  seqD1: { subject: '{nome}, como tá o fio hoje?', body: HTML_TEMPLATES['d1'] },
  seqD7: { subject: 'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)', body: HTML_TEMPLATES['d7'] },
  seqD21: { subject: '3 semanas de corte novo. Agora vem a parte boa.', body: HTML_TEMPLATES['d21'] },
  seqD35: { subject: '{nome}, chegou a hora.', body: HTML_TEMPLATES['d35'] },
  seqD60: { subject: 'Uma coisa que percebi depois de anos cortando cacheado', body: HTML_TEMPLATES['d60'] },
  seqD90: { subject: 'Esse é o último email que mando, {nome}.', body: HTML_TEMPLATES['d90'] },
  birthdayEnabled: { subject: 'Parabéns, {nome}.', body: HTML_TEMPLATES['aniversario'] }
};
`;

code = code.replace(/const EMAIL_PREVIEWS = \{[\s\S]*?\};\n/, newPreviews.trim() + '\n\n');

const modalRegex = /\{showEmailPreviewModal && \([\s\S]*?<div dangerouslySetInnerHTML=\{\{ __html: emailPreviewContent\.body\.replace\(\/\{nome\}\/g, 'Marina'\) \}\} \/>[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const getIframeStr = `
{showEmailPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowEmailPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Preview de E-mail
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{emailPreviewContent.subject.replace(/{nome}/g, 'Marina')}</div>
            </div>
            
            <div style={{ backgroundColor: '#f0eee9', width: '100%', height: '600px' }}>
              <iframe 
                srcDoc={\`
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head>
                    <meta charset="utf-8">
                    <title>Preview</title>
                    <style>\${EMAIL_CSS}</style>
                  </head>
                  <body style="margin: 0; padding: 0; background-color: #f0eee9; -webkit-font-smoothing: antialiased;">
                    <div class="mail-stage">
                      \${emailPreviewContent.body.replace(/{nome}/g, 'Marina')}
                    </div>
                  </body>
                  </html>
                \`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Email Preview"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEmailPreviewModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
`.trim();

code = code.replace(modalRegex, getIframeStr);

fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/pages/admin/AdminMarketing.jsx', code);
console.log("Updated AdminMarketing.jsx");
