const fs = require('fs');
const path = require('path');

const PRIVATE_DIR = path.join(__dirname, '..', 'private-assets');
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

module.exports = async (request, response) => {
  const requestedName = request.query?.name || '';
  const safeName = path.basename(requestedName).replace(/[^a-zA-Z0-9._-]/g, '');

  if (!safeName) {
    response.status(400).json({ error: 'Missing image name.' });
    return;
  }

  const filePath = path.join(PRIVATE_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    response.status(404).json({ error: 'Image not found.' });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    response.status(500).json({ error: 'Unable to read image.' });
  });

  stream.pipe(response);
};
