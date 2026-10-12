const http = require('http');
const fs = require('fs');
const path = require('path');
const chatHandler = require('./api/chat');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }

    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  });
}

loadEnvFile();

const rootDir = __dirname;
const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        const fallbackPath = path.join(rootDir, 'index.html');
        fs.readFile(fallbackPath, (fallbackError, fallbackContent) => {
          if (fallbackError) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
          }

          res.writeHead(200, { 'Content-Type': mimeTypes['.html'] || 'text/html; charset=utf-8' });
          res.end(fallbackContent);
        });
        return;
      }

      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/chat' || req.url.startsWith('/api/chat?')) {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      const response = {
        headers: {},
        statusCode: 200,
        setHeader(name, value) {
          this.headers[name] = value;
        },
        status(code) {
          this.statusCode = code;
          return {
            json: (payload) => {
              res.writeHead(code, this.headers);
              res.end(JSON.stringify(payload));
            }
          };
        },
        json(payload) {
          res.writeHead(this.statusCode, this.headers);
          res.end(JSON.stringify(payload));
        }
      };

      const request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body || {}
      };

      try {
        await chatHandler(request, response);
      } catch (error) {
        console.error('Chat handler crashed:', error);
        sendJson(res, 500, { error: 'Internal server error' });
      }
    });

    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Portfolio site running at http://localhost:${port}`);
});
