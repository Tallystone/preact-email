import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { get } from 'node:http';
import { discoverTemplates, templateName } from '../../../packages/email-preview/dist/discover.js';
import { renderTemplates } from '../../../packages/email-preview/dist/render-templates.js';
import { startPreview } from '../../../packages/email-preview/dist/server.js';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(join(repo, 'package.json'));
test('preview package works from an independent consumer project', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'email-preview-consumer-'));
  let preview: Awaited<ReturnType<typeof startPreview>> | undefined;
  try {
    for (const dir of ['node_modules/@tallystone', 'node_modules/esm-probe', 'emails/auth', 'emails/orders', 'emails/components', 'emails/static', 'emails/empty/nested', 'shared']) {
      await mkdir(join(cwd, dir), { recursive: true });
    }
    await symlink(join(repo, 'packages/email'), join(cwd, 'node_modules/@tallystone/preact-email'), 'dir');
    await symlink(dirname(require.resolve('preact/package.json')), join(cwd, 'node_modules/preact'), 'dir');
    await symlink(dirname(require.resolve('zod/package.json')), join(cwd, 'node_modules/zod'), 'dir');
    await writeFile(join(cwd, 'node_modules/esm-probe/package.json'), '{"type":"module","exports":"./index.js"}');
    await writeFile(join(cwd, 'node_modules/esm-probe/data.json'), '{"value":"native-esm"}');
    await writeFile(join(cwd, 'node_modules/esm-probe/index.js'), `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      export const value = await Promise.resolve(require('./data.json').value);
    `);
    await writeFile(join(cwd, 'package.json'), '{"name":"consumer","type":"module"}');
    // A React app's JSX configuration and TS path aliases must not break Preact emails.
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
      jsx: 'react-jsx', jsxImportSource: 'react', paths: { '@project/*': ['./shared/*'] },
    }}));
    await writeFile(join(cwd, 'shared/copy.ts'), 'export const greeting = "Welcome";');
    await writeFile(join(cwd, 'emails/auth/welcome.tsx'), `
      import { Html, Body, Preview, Text } from '@tallystone/preact-email';
      import { greeting } from '@project/copy';
      import { value } from 'esm-probe';
      import { z } from 'zod';
      if (value !== 'native-esm') throw new Error('Native ESM dependency failed');
      export default function Welcome({name}) {
        return <Html><Body><Preview useTitleTag={false}>Inbox &amp; preview</Preview><Text>{greeting}, {name}!</Text></Body></Html>;
      }
      Welcome.PreviewProps = {name: ' Robin '};
      Welcome.Schema = z.object({name:z.string().trim().min(1)});
      Welcome.Subject = ({name}) => 'Hello ' + name;
    `);
    await writeFile(join(cwd, 'emails/orders/receipt.tsx'), `
      import { Text } from '@tallystone/preact-email';
      let ready = false;
      export default function Receipt({total}) {
        if (!ready) throw Promise.resolve().then(() => { ready = true; });
        return <Text>Total: {total}</Text>;
      }
      export const scenarios = [{name:'paid', props:{total:25}}, {name:'free', props:{total:0}}];
    `);
    await writeFile(join(cwd, 'emails/broken.tsx'), 'export default function Broken() { throw new Error("Template failed"); }');
    await writeFile(join(cwd, 'emails/helper.tsx'), 'export const value = 1;');
    for (const file of ['components/layout.tsx', '_private.tsx', 'welcome.test.tsx']) {
      await writeFile(join(cwd, 'emails', file), 'throw new Error("Do not import helpers as email entries");');
    }
    await writeFile(join(cwd, 'emails/static/logo.png'), 'asset');
    await writeFile(join(cwd, 'secret.png'), 'private');
    await symlink(join(cwd, 'secret.png'), join(cwd, 'emails/static/leak.png'));
    const dir = join(cwd, 'emails');
    await t.test('recursive discovery excludes helpers and preserves relative paths', async () => {
      const files = (await discoverTemplates(dir)).map(file => templateName(dir, file));
      assert.deepEqual(files, ['auth/welcome', 'broken', 'helper', 'orders/receipt']);
    });
    await t.test('consumer resolution, PreviewProps, scenarios, subjects and async rendering', async () => {
      const { emails, dependencies } = await renderTemplates(dir, cwd);
      assert.equal(emails.length, 4);
      const welcome = emails.find(e => e.template === 'auth/welcome')!;
      assert.equal(welcome.text, 'Welcome, Robin!');
      assert.equal(welcome.preview, 'Inbox & preview');
      assert.equal(welcome.subject, 'Hello Robin');
      assert.equal(emails.find(e => e.id === 'orders/receipt--free')!.text, 'Total: 0');
      assert.equal(emails.find(e => e.template === 'broken')!.error, 'Template failed');
      assert(dependencies.includes(join(cwd, 'shared/copy.ts')));
    });
    await t.test('HTTP assets, errors, discovery updates and external helper reload', async () => {
      preview = await startPreview({ cwd, port: 0, log: () => {} });
      const base = `http://127.0.0.1:${preview.port}`;
      const metadata = async () => (await (await fetch(base + '/api/emails')).json()) as { emails: {id:string}[]; error:string };
      assert.equal((await metadata()).emails.length, 4);
      assert.match(await (await fetch(base)).text(), /folder-children/);
      assert.equal((await fetch(base + '/preview-dark-mode.js')).status, 200);
      assert.equal(await (await fetch(base + '/static/logo.png')).text(), 'asset');
      assert.equal((await fetch(base + '/static/leak.png')).status, 404);
      assert.equal((await fetch(base + '/static/%2e%2e%2fsecret.png')).status, 404);
      assert.equal(await new Promise<number | undefined>((resolve, reject) => {
        get(base, { headers: { Host: 'untrusted.example' } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
      }), 403);
      assert.equal((await fetch(base + '/email?id=broken--preview')).status, 422);
      await writeFile(join(cwd, 'shared/copy.ts'), 'export const greeting = "Good morning";');
      const deadline = Date.now() + 10000;
      let updated = '';
      while (Date.now() < deadline) {
        updated = await (await fetch(base + '/email?id=auth%2Fwelcome--preview&view=text')).text();
        if (updated === 'Good morning, Robin!') break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.equal(updated, 'Good morning, Robin!');
      await mkdir(join(cwd, 'emails/empty/nested/new-folder'));
      await writeFile(join(cwd, 'emails/empty/nested/new-folder/new.tsx'), 'export default function New() { return <p>New email</p>; }');
      const addedDeadline = Date.now() + 10000;
      let ids: string[] = [];
      while (Date.now() < addedDeadline) {
        ids = (await metadata()).emails.map(e => e.id);
        if (ids.includes('empty/nested/new-folder/new--preview')) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert(ids.includes('empty/nested/new-folder/new--preview'));
      await preview.close(); preview = undefined;
    });
    await t.test('invalid schema input is displayed as an email error', async () => {
      const file = join(cwd, 'emails/auth/welcome.tsx');
      await writeFile(file, (await readFile(file, 'utf8')).replace("{name: ' Robin '}", "{name: 42}"));
      const { emails } = await renderTemplates(dir, cwd);
      const welcome = emails.find(email => email.template === 'auth/welcome')!;
      assert(welcome.error?.includes('string'));
      assert.equal(welcome.html, '');
    });
  } finally {
    await preview?.close();
    await rm(cwd, { recursive: true, force: true });
  }
});
