const fs = require('fs');
const path = require('path');

const files = [
  'AdminClients.jsx',
  'AdminDashboard.jsx',
  'AdminFinancial.jsx',
  'AdminInventory.jsx',
  'AdminServices.jsx',
  'AdminSettings.jsx',
  'AdminMarketing.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'pages', 'admin', file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== ${file} ===`);
  
  // Find return ( statement or final markup block
  const lines = content.split('\n');
  let returnLineIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('return (') || (lines[i].includes('return') && lines[i].includes('<'))) {
      returnLineIndex = i;
      break;
    }
  }
  
  if (returnLineIndex !== -1) {
    console.log(`Return starts at line ${returnLineIndex + 1}:`);
    const preview = lines.slice(returnLineIndex, returnLineIndex + 80).join('\n');
    console.log(preview);
  } else {
    console.log('Could not find return statement.');
  }
  console.log('\n');
});
