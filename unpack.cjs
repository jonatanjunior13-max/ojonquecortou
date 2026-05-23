const fs = require('fs');
const zlib = require('zlib');
const html = fs.readFileSync('C:/Users/jonat/Downloads/Email Templates _standalone_ (1).html', 'utf8');

const match = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (match) {
  const manifest = JSON.parse(match[1]);
  for (const [uuid, entry] of Object.entries(manifest)) {
    if (entry.mime && (entry.mime.includes('javascript') || entry.mime.includes('text/jsx') || entry.mime.includes('text/babel'))) {
      const buffer = Buffer.from(entry.data, 'base64');
      if (entry.compressed) {
        try {
          const unzipped = zlib.gunzipSync(buffer);
          fs.writeFileSync(`C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/${uuid}.js`, unzipped);
        } catch (e) {
           console.log('Error gunzip:', e);
        }
      } else {
        fs.writeFileSync(`C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/${uuid}.js`, buffer);
      }
    }
  }
  console.log('Extracted JS files');
} else {
  console.log('Manifest not found');
}
