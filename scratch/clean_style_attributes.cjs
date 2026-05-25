const fs = require('fs');
const path = require('path');

function cleanHtml(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Regex to find style="..."
  const styleRegex = /style="([^"]*)"/g;
  
  html = html.replace(styleRegex, (match, styleContent) => {
    // Split properties by semicolon
    const props = styleContent.split(';');
    const cleanedProps = props.filter(prop => {
      const trimmed = prop.trim();
      if (!trimmed) return false;
      
      // Filter out CSS variables starting with --
      if (trimmed.startsWith('--')) return false;
      
      // Filter out properties with unclosed &quot; or corrupted quotes
      if (trimmed.includes('&quot;')) return false;
      
      return true;
    });
    
    return `style="${cleanedProps.join('; ')}"`;
  });
  
  // Write it back
  const outputPath = filePath.replace('_clean.html', '_super_clean.html');
  fs.writeFileSync(outputPath, html);
  console.log(`Cleaned ${filePath} -> ${outputPath}`);
}

cleanHtml('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html');
