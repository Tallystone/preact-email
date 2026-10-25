import { watch, type FSWatcher } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createServer, type ServerResponse, type IncomingMessage } from 'node:http';
import { isIP } from 'node:net';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTemplates, type EmailPreview } from './render-templates.ts';

export interface PreviewOptions {
  /** Consumer project root. Defaults to process.cwd(). */
  cwd?: string;
  /** Email template directory, relative to cwd. Defaults to emails. */
  dir?: string;
  /** Files served beneath /static/. Defaults to <dir>/static. */
  staticDir?: string;
  port?: number;
  host?: string;
  log?: (message: string) => void;
}

export async function startPreview(options: PreviewOptions = {}) {
  const projectDir = resolve(options.cwd ?? process.cwd());
  const directory = resolve(projectDir, options.dir ?? 'emails');
  if (!(await stat(directory)).isDirectory()) throw new Error(`Not an email directory: ${directory}`);
  const staticDir = resolve(projectDir, options.staticDir ?? join(directory, 'static'));
  const packageDir = dirname(fileURLToPath(import.meta.url));
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 3000;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be between 0 and 65535');
  const log = options.log ?? console.log;
  let emails: EmailPreview[] = [];
  let error = '';
  let revision = 0;
  let closing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = Promise.resolve();
  const clients = new Set<ServerResponse>();
  const watchers = new Map<string, FSWatcher>();

  function schedule() {
    if (closing) return;
    clearTimeout(timer);
    timer = setTimeout(() => { pending = pending.then(rebuild); }, 150);
  }
  function watchDirectory(path: string, recursive: boolean) {
    if (watchers.has(path)) return;
    try {
      const watcher = watch(path, { recursive: recursive || path === directory || path === staticDir }, (_, file) => {
        if (!file || !file.split(/[\\/]/).some(part => part === 'node_modules' || part === '.git' || part.startsWith('.'))) schedule();
      });
      watcher.on('error', cause => log(`Watch error for ${path}: ${cause.message}`));
      watchers.set(path, watcher);
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') log(`Unable to watch ${path}: ${String(cause)}`);
    }
  }
  async function rebuild() {
    if (closing) return;
    try {
      const result = await renderTemplates(directory, projectDir);
      if (closing) return;
      emails = result.emails;
      error = '';
      // Watch imported helpers outside the email tree without recursively watching
      // the consumer's entire node_modules or repository.
      const dependencies = new Set(result.dependencies
        .filter(file => !file.split(sep).includes('node_modules'))
        .map(file => dirname(file)));
      dependencies.add(projectDir);
      for (const path of dependencies) watchDirectory(path, false);
      for (const [path, watcher] of watchers) {
        if (path !== directory && path !== staticDir && path !== packageDir && !dependencies.has(path)) {
          watcher.close(); watchers.delete(path);
        }
      }
      log(`Rendered ${new Set(emails.map(email => email.template)).size} emails (${emails.length} previews).`);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
      log(error);
    }
    revision++;
    for (const client of clients) client.write(`data: ${revision}\n\n`);
  }

  const mime: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.css': 'text/css; charset=utf-8',
  };
  async function serveAsset(base: string, name: string, res: ServerResponse) {
    try {
      const decoded = decodeURIComponent(name);
      if (decoded.split(/[\\/]/).some(part => part.startsWith('.'))) throw new Error('Hidden path');
      const root = await realpath(base);
      const path = await realpath(resolve(root, decoded));
      const rel = relative(root, path);
      if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Outside asset root');
      const type = mime[extname(path).toLowerCase()];
      if (!type) throw new Error('Unsupported asset type');
      res.setHeader('Content-Type', type);
      res.end(await readFile(path));
    } catch { res.writeHead(404); res.end('Asset not found'); }
  }
  async function handle(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Method not allowed'); return; }
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (!(isIP(hostname) || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === host)) {
      res.writeHead(403); res.end('Host not allowed'); return;
    }
    if (url.pathname === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
      if (req.method === 'HEAD') { res.end(); return; }
      clients.add(res);
      res.write(`data: ${revision}\n\n`);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (url.pathname === '/api/emails') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ emails: emails.map(({ html, text, ...meta }) => meta), error }));
      return;
    }
    if (url.pathname === '/preview-dark-mode.js') {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.end(await readFile(join(packageDir, 'preview-dark-mode.js')));
      return;
    }
    if (url.pathname.startsWith('/static/')) { await serveAsset(staticDir, url.pathname.slice(8), res); return; }
    if (url.pathname.startsWith('/assets/')) { await serveAsset(join(directory, 'assets'), url.pathname.slice(8), res); return; }
    if (url.pathname === '/email') {
      const email = emails.find(email => email.id === url.searchParams.get('id'));
      if (!email) { res.writeHead(404); res.end('Email not found'); return; }
      if (email.error) {
        res.writeHead(422, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(email.error); return;
      }
      const text = url.searchParams.get('view') === 'text';
      res.setHeader('Content-Type', text ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8');
      res.end(text ? email.text : email.html); return;
    }
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(await readFile(join(packageDir, 'preview.html'))); return;
    }
    res.writeHead(404); res.end('Not found');
  }
  const server = createServer((req, res) => {
    void handle(req, res).catch(cause => {
      log(String(cause));
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Preview request failed');
    });
  });
  await rebuild();
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => { server.removeListener('error', reject); resolveListen(); });
  }).catch(cause => {
    for (const watcher of watchers.values()) watcher.close();
    throw cause;
  });
  server.on('error', cause => log(cause.message));
  watchDirectory(directory, true);
  if (staticDir !== directory) watchDirectory(staticDir, true);
  watchDirectory(packageDir, false);
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return {
    port: actualPort,
    host,
    directory,
    async close() {
      closing = true;
      clearTimeout(timer);
      for (const watcher of watchers.values()) watcher.close();
      for (const client of clients) client.end();
      const stopped = new Promise<void>((resolveClose, reject) => server.close(cause => cause ? reject(cause) : resolveClose()));
      server.closeAllConnections();
      await Promise.all([pending, stopped]);
    },
  };
}
