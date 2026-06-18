import sharp from 'sharp';

export default async function handler(req, res) {
  let { file } = req.query;

  if (!file) {
    return res.status(400).end('File name required');
  }

  try {
    let originalUrl = '';
    let shouldConvertWebp = false;

    // Detect if we need to convert WebP to JPG
    if (file.toLowerCase().endsWith('.webp.jpg') || file.toLowerCase().endsWith('.webp.jpeg')) {
      shouldConvertWebp = true;
      // Reconstruct the original WebP file name
      const baseName = file.slice(0, -4); // remove '.jpg'
      
      if (baseName.startsWith('gbp-') || baseName.includes('gallery%2F') || baseName.includes('gallery/')) {
        // It's a Firebase Storage file
        originalUrl = `https://firebasestorage.googleapis.com/v0/b/ojonque.firebasestorage.app/o/gallery%2F${encodeURIComponent(baseName)}?alt=media`;
      } else {
        // It's a local public asset
        originalUrl = `https://www.ojonquecortou.com.br/${baseName}`;
      }
    } else if (file.startsWith('external_') && file.endsWith('.jpg')) {
      shouldConvertWebp = true;
      const base64Url = file.slice(9, -4); // remove 'external_' and '.jpg'
      originalUrl = Buffer.from(base64Url, 'base64').toString('utf8');
    } else {
      // Standard Firebase Storage request
      originalUrl = `https://firebasestorage.googleapis.com/v0/b/ojonque.firebasestorage.app/o/gallery%2F${encodeURIComponent(file)}?alt=media`;
    }

    const response = await fetch(originalUrl);

    if (!response.ok) {
      return res.status(response.status).end(`Error fetching file from source: ${originalUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    if (shouldConvertWebp) {
      // Convert WebP image to JPEG using Sharp
      buffer = await sharp(buffer)
        .jpeg({ quality: 85 })
        .toBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
    } else {
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
    }

    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Error in media proxy:', error);
    return res.status(500).end('Internal Server Error');
  }
}
