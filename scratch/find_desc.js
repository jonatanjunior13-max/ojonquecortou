const fs = require('fs');
const lines = fs.readFileSync('src/pages/BookingPage.jsx', 'utf8').split('\n');
lines.forEach((line, index) => {
  if (line.includes('description') || line.includes('services.map')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
