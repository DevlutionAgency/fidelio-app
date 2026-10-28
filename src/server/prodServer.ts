import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { apiMiddleware } from './apiRouter.ts';
import { runMigrations, isRemoteDb, dbUrl } from '../db/index.ts';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function serveFile(res: http.ServerResponse, filePath: string, ext: string) {
  const mime = MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
  const isHashedAsset = filePath.includes(path.sep + 'assets' + path.sep);

  res.statusCode = 200;
  res.setHeader('Content-Type', mime);

  if (isHashedAsset) {
    // 1 year immutable cache for Vite-hashed assets
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (ext === '.html') {
    // No cache for HTML entry point so updates are seen instantly
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    // 1 hour cache for regular images/icons
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.statusCode = 500;
    res.end('Server Error');
  });
  stream.pipe(res);
}

async function start() {
  console.log('📦 Initialisation de la base de données...');
  await runMigrations();
  console.log(`✅ Base de données active : ${isRemoteDb ? 'Turso Cloud (' + dbUrl + ')' : dbUrl}`);

  if (!fs.existsSync(DIST_DIR)) {
    console.warn('⚠️ Le dossier dist/ n’existe pas. Lancez `npm run build` pour générer le bundle de production.');
  }

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. API routes (/api/*)
    if (pathname.startsWith('/api/')) {
      apiMiddleware(req, res);
      return;
    }

    // 2. Static files in dist/
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const candidateFile = path.join(DIST_DIR, safePath);

    if (fs.existsSync(candidateFile) && fs.statSync(candidateFile).isFile()) {
      serveFile(res, candidateFile, path.extname(candidateFile));
      return;
    }

    // 3. SPA Fallback: serve dist/index.html for any client-side routing
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      serveFile(res, indexHtml, '.html');
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Fidelio : dist/index.html introuvable. Exécutez `npm run build`.');
  });

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur de production Fidelio démarré sur : http://${HOST}:${PORT}`);
    console.log(`🌐 Prêt pour le trafic Internet en production.`);
  });
}

start().catch((err) => {
  console.error('❌ Échec au démarrage du serveur de production :', err);
  process.exit(1);
});
