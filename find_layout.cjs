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

let output = '';

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'pages', 'admin', file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  output += `=== ${file} ===\n`;
  
  const lines = content.split('\n');
  let returnLineIndex = -1;
  let returnBraceCount = 0;
  
  // Let's find return ( statement that is inside the main component function
  // We can search for the export default line to find the main component name
  const exportMatch = content.match(/export\s+default\s+(\w+)/);
  if (exportMatch) {
    const compName = exportMatch[1];
    output += `Component Name: ${compName}\n`;
    
    // Let's look for "const ComponentName = "
    const compStartIdx = lines.findIndex(l => l.includes(`const ${compName} =`));
    if (compStartIdx !== -1) {
      // Find return ( inside this component
      for (let i = compStartIdx; i < lines.length; i++) {
        if (lines[i].includes('return (') || (lines[i].includes('return') && lines[i].includes('<') && !lines[i].includes('//'))) {
          returnLineIndex = i;
        }
      }
    }
  }
  
  // If not found by name, just get the last return (
  if (returnLineIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('return (') || (lines[i].includes('return') && lines[i].includes('<') && !lines[i].includes('//'))) {
        returnLineIndex = i;
      }
    }
  }
  
  if (returnLineIndex !== -1) {
    output += `Return found at line ${returnLineIndex + 1}:\n`;
    const preview = lines.slice(returnLineIndex, returnLineIndex + 120).join('\n');
    output += preview + '\n';
  } else {
    output += 'Could not find return statement.\n';
  }
  output += '\n--------------------------------------------------\n\n';
});

fs.writeFileSync(path.join(__dirname, 'layout_info.txt'), output, 'utf8');
console.log('Layout info written to layout_info.txt');
