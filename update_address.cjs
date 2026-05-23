const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  replacements.forEach(rep => {
    content = content.split(rep.search).join(rep.replace);
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated: ' + filePath);
  }
}

const basePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou';

// 1. src/utils/emailTemplates.js
replaceInFile(path.join(basePath, 'src/utils/emailTemplates.js'), [
  { search: 'Rua dos Cacheados, 218', replace: 'Rua Francisco Ovídio, 184' }
]);

// 2. api/send-email.js
replaceInFile(path.join(basePath, 'api/send-email.js'), [
  { search: 'Rua dos Cacheados, 218 — Caiçara — Belo Horizonte', replace: 'Rua Francisco Ovídio, 184 — Caiçara — Belo Horizonte' },
  { search: 'Rua dos Cacheados, 218', replace: 'Rua Francisco Ovídio, 184' }
]);

// 3. src/pages/admin/AdminClients.jsx
replaceInFile(path.join(basePath, 'src/pages/admin/AdminClients.jsx'), [
  { search: 'Rua Jacuí, 312 - Floresta', replace: 'Rua Francisco Ovídio, 184 - Caiçara' }
]);

// 4. src/pages/admin/AdminDashboard.jsx
replaceInFile(path.join(basePath, 'src/pages/admin/AdminDashboard.jsx'), [
  { search: 'Rua Jacuí, 312 - Floresta', replace: 'Rua Francisco Ovídio, 184 - Caiçara' }
]);

// 5. src/pages/admin/AdminMobileApp.jsx
replaceInFile(path.join(basePath, 'src/pages/admin/AdminMobileApp.jsx'), [
  { search: 'Rua Jacuí, 312 - Floresta', replace: 'Rua Francisco Ovídio, 184 - Caiçara' }
]);

// 6. src/pages/admin/AdminSettings.jsx
replaceInFile(path.join(basePath, 'src/pages/admin/AdminSettings.jsx'), [
  { search: 'Rua Jacuí, 312 - Floresta', replace: 'Rua Francisco Ovídio, 184 - Caiçara' }
]);

console.log('All files updated');
