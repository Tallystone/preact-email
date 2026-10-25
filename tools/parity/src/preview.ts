import { watch } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { readFile, readdir } from 'node:fs/promises';
import { createServer, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';
import { extractPreview, previewMetadataPlugin } from './preview-metadata.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixtures = join(root, 'tools/parity/test-emails');
const require = createRequire(join(root, 'package.json'));
interface Email {
  id: string;
  template: string;
  name: string;
  html: string;
  text: string;
  subject?: string;
  preview?: string;
}
let emails: Email[] = [];
let error = '';
let revision = 0;
const clients = new Set<ServerResponse>();

async function rebuild() {
  try {
    const files = (await readdir(fixtures))
      .filter((f) => f.endsWith('.tsx'))
      .sort();
    const imports = files.map(
      (file, i) =>
        `import Email${i}, * as module${i} from ${JSON.stringify(join(fixtures, file))};`,
    );
    const entries = files.map(
      (file, i) =>
        `...(module${i}.scenarios?.length ? module${i}.scenarios : [{ name: 'preview', props: Email${i}.PreviewProps ?? {} }]).map((s) => ({ id: ${JSON.stringify(file.slice(0, -4))} + '--' + s.name, template: ${JSON.stringify(file.slice(0, -4))}, name: s.name, subject: typeof Email${i}.Subject === 'function' ? Email${i}.Subject(s.props) : undefined, ...renderEmail(h(Email${i}, s.props)) }))`,
    );
    const result = await build({
      stdin: {
        contents: `import { h } from 'preact'; import { renderEmail } from '@hillac/preact-email'; ${imports.join('\n')} module.exports = [${entries.join(',')}];`,
        resolveDir: fixtures,
      },
      plugins: [previewMetadataPlugin],
      bundle: true,
      write: false,
      platform: 'node',
      format: 'cjs',
      target: 'node22',
      jsx: 'automatic',
      jsxImportSource: 'preact',
      alias: {
        '@hillac/preact-email': join(root, 'packages/email/src/index.ts'),
      },
      logLevel: 'silent',
    });
    const module = { exports: [] as Email[] };
    new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(
      require,
      module,
      module.exports,
    );
    emails = module.exports.map((email) => ({
      ...email,
      preview: extractPreview(email.html),
    }));
    error = '';
    console.log(
      `Rendered ${new Set(emails.map((email) => email.template)).size} emails (${emails.length} previews).`,
    );
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
    console.error(error);
  }
  revision++;
  for (const client of clients) client.write(`data: ${revision}\n\n`);
}
await rebuild();
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    });
    clients.add(res);
    res.write(`data: ${revision}\n\n`);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (url.pathname === '/api/emails') {
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        emails: emails.map(({ html, text, ...meta }) => meta),
        error,
      }),
    );
    return;
  }
  if (url.pathname === '/preview-dark-mode.js') {
    try {
      const source = await readFile(
        join(root, 'tools/parity/src/preview-dark-mode.ts'),
        'utf8',
      );
      const result = await transform(source, {
        loader: 'ts',
        format: 'esm',
        target: 'es2022',
      });
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.end(result.code);
    } catch {
      res.writeHead(500);
      res.end('Unable to load dark-mode profiles');
    }
    return;
  }
  if (/^\/assets\/dark-mode-logo-(light|dark)\.png$/.test(url.pathname)) {
    try {
      res.setHeader('Content-Type', 'image/png');
      res.end(await readFile(join(fixtures, url.pathname.slice(1))));
    } catch {
      res.writeHead(404);
      res.end('Asset not found');
    }
    return;
  }
  if (url.pathname === '/email') {
    const email = emails.find((e) => e.id === url.searchParams.get('id'));
    if (!email) {
      res.writeHead(404);
      res.end('Email not found');
      return;
    }
    const text = url.searchParams.get('view') === 'text';
    res.setHeader(
      'Content-Type',
      text ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8',
    );
    res.end(text ? email.text : email.html);
    return;
  }
  if (url.pathname === '/') {
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(await readFile(join(root, 'tools/parity/src/preview.html')));
    } catch {
      res.writeHead(500);
      res.end('Unable to load preview UI');
    }
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});
let timer: ReturnType<typeof setTimeout>;
let pending = Promise.resolve();
const watchers = [
  'tools/parity/test-emails',
  'packages/email/src',
  'tools/parity/src',
].map((dir) =>
  watch(join(root, dir), { recursive: true }, (_, file) => {
    if (!file || !/\.(tsx?|html)$/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      pending = pending.then(rebuild);
    }, 150);
  }),
);
const port = Number(process.env.PORT ?? 3000);
// Like Vite: localhost by default; --host explicitly exposes the server.
let host = '127.0.0.1';
const args = process.argv.slice(2).filter((arg) => arg !== '--');
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === '--host') {
    const next = args[i + 1];
    host = next && !next.startsWith('--') ? args[++i]! : '0.0.0.0';
  } else if (arg.startsWith('--host=')) {
    host = arg.slice('--host='.length) || '0.0.0.0';
  } else
    throw new Error(
      `Unknown option: ${arg}. Usage: pnpm preview [--host [address]]`,
    );
}
server.listen(port, host, () => {
  if (host === '0.0.0.0' || host === '::') {
    console.log(`Local: http://localhost:${port}`);
    for (const addresses of Object.values(networkInterfaces())) {
      for (const address of addresses ?? []) {
        if (!address.internal && address.family === 'IPv4')
          console.log(`Network: http://${address.address}:${port}`);
      }
    }
  } else {
    console.log(
      `Preview: http://${host.includes(':') ? '[' + host + ']' : host}:${port}`,
    );
  }
});
server.on('error', (cause) => {
  console.error(cause.message);
  process.exit(1);
});
function close() {
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  for (const client of clients) client.end();
  server.close();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
