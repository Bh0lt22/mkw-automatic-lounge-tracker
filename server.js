/*
 * server.js — Server HTTP statico per MKW Lounge Tracker.
 *
 * Non richiede npm install: usa solo moduli nativi di Node (http, fs, path, url).
 *
 * Avvio:
 *   node server.js             [porta 8000]
 *   PORT=9000 node server.js   [porta personalizzata]
 *
 * Poi apri nel browser:
 *   http://localhost:8000
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const ROOT = __dirname;

// MIME types per estensioni comuni
const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js':   'text/javascript; charset=utf-8',
	'.mjs':  'text/javascript; charset=utf-8',
	'.css':  'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png':  'image/png',
	'.jpg':  'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif':  'image/gif',
	'.webp': 'image/webp',
	'.svg':  'image/svg+xml',
	'.ico':  'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf':  'font/ttf',
	'.otf':  'font/otf',
	'.txt':  'text/plain; charset=utf-8',
	'.md':   'text/markdown; charset=utf-8',
	'.map':  'application/json',
};

const server = http.createServer((req, res) => {
	const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
	let pathname = decodeURIComponent(reqUrl.pathname);

	// Mappa '/' a '/index.html'
	if (pathname === '/') pathname = '/index.html';

	// Preveni path traversal
	const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
	const filePath = path.join(ROOT, safePath);

	// Verifica che il file sia dentro ROOT
	if (!filePath.startsWith(ROOT)) {
		res.writeHead(403);
		res.end('403 Forbidden');
		return;
	}

	fs.stat(filePath, (err, stats) => {
		if (err || !stats.isFile()) {
			res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end(`404 Not Found: ${pathname}`);
			return;
		}

		const ext = path.extname(filePath).toLowerCase();
		const mime = MIME[ext] || 'application/octet-stream';

		// Headers CORS e cache
		const headers = {
			'Content-Type': mime,
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Access-Control-Allow-Origin': '*',
		};

		// Per moduli ES, imposta il MIME corretto (richiesto dai browser)
		if (ext === '.js' || ext === '.mjs') {
			headers['Content-Type'] = 'text/javascript; charset=utf-8';
		}

		const stream = fs.createReadStream(filePath);
		stream.on('open', () => {
			res.writeHead(200, headers);
			stream.pipe(res);
		});
		stream.on('error', () => {
			res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end('500 Internal Server Error');
		});
	});
});

server.listen(PORT, () => {
	console.log('');
	console.log('┌────────────────────────────────────────────────────────────┐');
	console.log('│  MKW Lounge Tracker — server locale                       │');
	console.log('├────────────────────────────────────────────────────────────┤');
	console.log(`│  Apri nel browser:  http://localhost:${PORT}`.padEnd(60) + '│');
	console.log('│                                                            │');
	console.log('│  Per fermare il server: Ctrl+C                            │');
	console.log('└────────────────────────────────────────────────────────────┘');
	console.log('');
	console.log('Tip: per cambiare porta, esegui PORT=9000 node server.js');
	console.log('');
});
