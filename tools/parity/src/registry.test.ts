import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import test from 'node:test';
import { h } from 'preact';
import { z } from 'zod';
import { createEmailRenderer } from '../../../packages/email-registry/dist/index.js';
import { generateRegistry } from '../../../packages/email-registry/dist/generate.js';
import { renderTemplates } from '../../../packages/email-preview/dist/render-templates.js';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
test('optional schemas validate and transform before subject or rendering', async () => {
  const schema = z.object({
    name: z.string().trim().min(1),
    count: z.string().default('2').transform(Number).pipe(z.number().int().positive()),
  }).refine(async props => props.name !== 'blocked', 'Blocked name');
  let calls = 0;
  function Email(props: z.output<typeof schema>) { calls++; return h('p', {}, `${props.name}: ${props.count + 1}`); }
  Email.Schema = schema;
  Email.Subject = async (props: z.output<typeof schema>) => `${props.name} / ${props.count}`;
  const email = createEmailRenderer(Email);
  assert.equal(email.schema, schema);
  const rendered = await email.render({ name: ' <Robin> ' });
  assert.equal(rendered.text, '<Robin>: 3');
  assert.equal(rendered.subject, '<Robin> / 2');
  assert.match(rendered.html, /&lt;Robin(?:&gt;|>)/);
  await assert.rejects(email.render({ name: 'blocked' }));
  await assert.rejects(email.render({ name: 'Robin', count: '-2' }));
  assert.equal(calls, 1);
  const plain = createEmailRenderer(() => h('p', {}, 'No metadata'));
  assert.equal(plain.schema, undefined);
  assert.deepEqual(Object.keys(await plain.render()).sort(), ['html', 'text']);
  const defaults = createEmailRenderer(Object.assign((props: { count: number }) => h('p', {}, props.count), {
    Schema: z.object({ count: z.number().default(4) }),
  }));
  assert.equal((await defaults.render()).text, '4');
});

test('sync rendering validates, transforms and matches async output', async () => {
  const schema = z.object({ name: z.string().trim().min(1), count: z.string().default('2').transform(Number) });
  let calls = 0;
  function Email(props: z.output<typeof schema>) { calls++; return h('p', {}, `${props.name}: ${props.count}`); }
  Email.Schema = schema;
  Email.Subject = (props: z.output<typeof schema>) => `${props.name} / ${props.count}`;
  const email = createEmailRenderer(Email);
  const result = email.renderSync({ name: ' <Robin> ' });
  assert.equal(result instanceof Promise, false);
  assert.equal(result.subject, '<Robin> / 2');
  assert.equal(result.text, '<Robin>: 2');
  assert.deepEqual(result, await email.render({ name: ' <Robin> ' }));
  const before = calls;
  assert.throws(() => email.renderSync({ name: '' }), z.ZodError);
  assert.equal(calls, before);
  const plain = createEmailRenderer(() => h('p', {}, 'No metadata'));
  assert.deepEqual(plain.renderSync(), await plain.render());
  const defaults = createEmailRenderer(Object.assign((props: { count: number }) => h('p', {}, props.count), {
    Schema: z.object({ count: z.number().default(4) }),
  }));
  assert.equal(defaults.renderSync().text, '4');
});

test('sync rendering rejects async validation, subjects and components', () => {
  let calls = 0;
  const component = () => { calls++; return h('p', {}, 'Hello'); };
  const validated = createEmailRenderer(Object.assign(component, {
    Schema: z.object({}).refine(async () => true),
  }));
  assert.throws(() => validated.renderSync(), /Promise|async/i);
  assert.equal(calls, 0);
  const subject = createEmailRenderer(Object.assign(() => h('p', {}, 'Hello'), {
    Subject: async () => 'Hello',
  }));
  assert.throws(() => subject.renderSync(), /Async subjects require render/);
  const suspended = createEmailRenderer(() => { throw Promise.resolve(); });
  assert.throws(() => suspended.renderSync());
});

test('registry generation discovers folders, excludes helpers, detects collisions', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'email-registry-'));
  try {
    const dir = join(cwd, 'emails');
    await mkdir(join(dir, 'orders'), { recursive: true });
    await mkdir(join(dir, 'components'));
    await mkdir(join(dir, 'demo-emails'));
    await writeFile(join(dir, 'components/notice.tsx'), 'export default () => <p>Notice</p>;');
    await writeFile(join(dir, 'demo-emails/example.tsx'), 'export default () => <p>Example</p>;');
    await writeFile(join(dir, 'orders/checkout-complete.tsx'), 'export default function Email() { return <p>Hello</p>; }');
    await writeFile(join(dir, 'helper.tsx'), 'export const helper = 1;');
    const out = join(cwd, 'emails.generated.ts');
    await generateRegistry(dir, out);
    const source = await readFile(out, 'utf8');
    assert.match(source, /"orders": \{/);
    assert.match(source, /"components": \{/);
    assert.match(source, /"notice": createEmailRenderer/);
    assert.match(source, /"checkoutComplete": createEmailRenderer\(Email2\)/);
    assert.match(source, /\.\/emails\/orders\/checkout-complete\.js/);
    assert(!source.includes('helper'));
    const ignoredOut = join(cwd, 'emails.ignored.generated.ts');
    await generateRegistry(dir, ignoredOut, { ignore: ['/components', '/demo-emails'] });
    const ignoredSource = await readFile(ignoredOut, 'utf8');
    assert(!ignoredSource.includes('components'));
    assert(!ignoredSource.includes('demo-emails'));
    assert.match(ignoredSource, /"checkoutComplete": createEmailRenderer\(Email0\)/);
    await writeFile(join(dir, 'orders/checkout_complete.tsx'), 'export default () => <p>Collision</p>;');
    await assert.rejects(generateRegistry(dir, out), /Duplicate registry key/);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test('real fixtures preview in ESM and generate a typed consumer registry', async () => {
  const dir = join(repo, 'tools/parity/test-emails');
  await generateRegistry(dir, join(repo, 'tools/parity/test-emails.generated.ts'));
  const { emails } = await renderTemplates(dir, repo);
  assert(emails.length >= 20);
  assert.deepEqual(emails.filter(email => email.error), []);
  const images = emails.find(email => email.template === 'image-receipt')!;
  assert.match(images.html, /alt="Harbor Supply logo"/);
  assert.equal(images.subject, undefined);
  const showcase = emails.find(email => email.template === 'component-showcase')!;
  assert.match(showcase.html, /Getting started/);
  assert.match(showcase.html, /padding/);
});

test('generated registry renders real emails and rejects invalid cart props', async () => {
  const output = await mkdtemp(join(repo, 'tools/parity/.email-fixtures-'));
  try {
    await generateRegistry(join(repo, 'tools/parity/test-emails'), join(repo, 'tools/parity/test-emails.generated.ts'));
    const entry = join(output, 'registry.mjs');
    await build({ entryPoints: [join(repo, 'tools/parity/test-emails.generated.ts')], outfile: entry,
      bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', jsxImportSource: 'preact',
    });
    const { emails } = await import(pathToFileURL(entry).href);
    const props = { recipient: 'Robin', orderId: 'ORDER-1', cart: [{ sku: 'book', name: 'Field notes', quantity: 2, unitPriceCents: 500 }], shippingCents: 0, taxCents: 0, discountCents: 0 };
    const receipt = await emails.checkoutComplete.render(props);
    assert.deepEqual(emails.checkoutComplete.renderSync(props), receipt);
    assert.equal(receipt.subject, 'Order ORDER-1 — checkout complete');
    assert.match(receipt.text, /Field notes/);
    await assert.rejects(emails.checkoutComplete.render({ ...props, cart: [{ ...props.cart[0], quantity: -1 }] }));
    assert.equal(emails.imageReceipt.schema, undefined);
    assert.match((await emails.imageReceipt.render()).html, /alt="Harbor Supply logo"/);
    assert.match((await emails.componentShowcase.render({ name: 'Casey' })).text, /WELCOME, CASEY/);
  } finally { await rm(output, { recursive: true, force: true }); }
});
