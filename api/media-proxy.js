export default async function handler(req, res) {
  const { file } = req.query;

  if (!file) {
    return res.status(400).end('File name required');
  }

  try {
    const firebaseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/ojonque.firebasestorage.app/o/gallery%2F${encodeURIComponent(file)}?alt=media`;
    
    const response = await fetch(firebaseStorageUrl);

    if (!response.ok) {
      return res.status(response.status).end('Error fetching file from storage');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Error in media proxy:', error);
    return res.status(500).end('Internal Server Error');
  }
}
