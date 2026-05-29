const fs = require('fs');
const lines = fs.readFileSync('src/pages/admin/AdminMobileApp.jsx', 'utf8').split('\n');
lines.forEach((line, index) => {
  if (line.includes('status') || line.includes('confirmado') || line.includes('cancelado')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
