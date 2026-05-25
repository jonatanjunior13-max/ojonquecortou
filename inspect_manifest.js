const fs = require('fs');
const html = fs.readFileSync('C:/Users/jonat/Downloads/Email Templates _standalone_ (1).html', 'utf8');

const match = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (match) {
  const manifest = JSON.parse(match[1]);
  console.log('Manifest found. Keys:');
  for (const [uuid, entry] of Object.entries(manifest)) {
    console.log(`Key: ${uuid}, mime: ${entry.mime}, size: ${entry.data.length}, compressed: ${entry.compressed}`);
  }
} else {
  console.log('Manifest not found');
}
