import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startPreview } from '../../../packages/email-preview/dist/server.js';

test('default ports skip occupied ports; explicit ports fail', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'preview-ports-'));
  const blockers = [createServer(), createServer()];
  let preview: Awaited<ReturnType<typeof startPreview>> | undefined;
  try {
    for (const [index, server] of blockers.entries()) {
      await new Promise<void>((resolve, reject) => {
        server.once('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') resolve();
          else reject(error);
        });
        server.listen(3000 + index, '127.0.0.1', resolve);
      });
    }
    await assert.rejects(startPreview({ cwd, dir: '.', port: 3000, log: () => {} }), { code: 'EADDRINUSE' });
    preview = await startPreview({ cwd, dir: '.', log: () => {} });
    assert(preview.port >= 3002);
    assert.equal((await fetch(`http://127.0.0.1:${preview.port}`)).status, 200);
  } finally {
    await preview?.close();
    await Promise.all(blockers.filter(server => server.listening).map(server => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    })));
    await rm(cwd, { recursive: true, force: true });
  }
});
