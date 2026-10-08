import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthHandler from './api/health.js';
import mcpProxyHandler from './api/mcp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  next();
});

app.all(['/api/health.js', '/api/health'], healthHandler);
app.all(['/api/mcp.js', '/api/mcp'], mcpProxyHandler);

if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  const dist = path.join(__dirname, 'dist');
  app.use(
    express.static(dist, {
      index: false,
      setHeaders(res, file) {
        res.setHeader(
          'Cache-Control',
          file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    }),
  );
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`ActiveNutri running on http://localhost:${port} (${isProd ? 'production' : 'development'})`);
});
