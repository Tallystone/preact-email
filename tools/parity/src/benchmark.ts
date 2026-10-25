import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { render as upstreamRender, toPlainText as upstreamText } from 'react-email';
import { render, renderEmail, toPlainText, textFromTree } from '../../../packages/email/dist/index.js';
import { fixtures, makePreact, makeReact } from './fixtures.js';
import { normalizeHtml } from './normalize.js';
import { htmlToTextBaseline } from './html-to-text-baseline.js';

const iterations = Number(process.env.BENCH_ITERATIONS ?? 200);
const samples = Number(process.env.BENCH_SAMPLES ?? 5);
if (!Number.isInteger(iterations) || iterations < 1 || !Number.isInteger(samples) || samples < 1) throw new Error('Benchmark counts must be positive integers');
const corpus = await Promise.all(fixtures.map(async f => {
  const html = await upstreamRender(makeReact(f.spec));
  const text = upstreamText(html);
  assert.equal(htmlToTextBaseline(html), text);
  const local = render(makePreact(f.spec));
  assert.deepEqual(normalizeHtml(local), normalizeHtml(html));
  assert.equal(htmlToTextBaseline(local), text);
  for (const method of ['parser', 'regex', 'tree'] as const) assert.equal(renderEmail(makePreact(f.spec), { textMethod: method }).text, text);
  return { ...f, html, text };
}));
let checksum = 0;
type Job = { name: string; run: (i: number) => number | Promise<number> };
const at = (i: number) => corpus[i % corpus.length]!;
const jobs: Job[] = [
  { name: 'upstream HTML', run: async i => (await upstreamRender(makeReact(at(i).spec))).length },
  { name: 'preact HTML', run: i => render(makePreact(at(i).spec)).length },
  { name: 'upstream HTML + text', run: async i => { const html = await upstreamRender(makeReact(at(i).spec)); return html.length + htmlToTextBaseline(html).length; } },
  { name: 'preact HTML + upstream html-to-text', run: i => { const html = render(makePreact(at(i).spec)); return html.length + htmlToTextBaseline(html).length; } },
  ...(['parser', 'regex', 'tree'] as const).map(textMethod => ({ name: `preact HTML + ${textMethod}`, run: (i: number) => { const value = renderEmail(makePreact(at(i).spec), { textMethod }); return value.html.length + value.text.length; } })),
  { name: 'upstream text only (pre-rendered HTML)', run: i => htmlToTextBaseline(at(i).html).length },
  { name: 'parser text only (pre-rendered HTML)', run: i => toPlainText(at(i).html).length },
  { name: 'regex text only (pre-rendered HTML)', run: i => toPlainText(at(i).html, 'regex').length },
  { name: 'tree text only (includes template creation)', run: i => textFromTree(makePreact(at(i).spec)).length },
];
const timings = new Map(jobs.map(j => [j.name, [] as number[]]));
for (const job of jobs) for (let i = 0; i < 50; i++) checksum += await job.run(i);
// Rotate job order between samples to reduce order/thermal bias. Time sync loops
// without adding a Promise per render; only upstream's async API is awaited.
for (let sample = 0; sample < samples; sample++) {
  for (let offset = 0; offset < jobs.length; offset++) {
    const job = jobs[(offset + sample) % jobs.length]!;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const result = job.run(i);
      checksum += typeof result === 'number' ? result : await result;
    }
    timings.get(job.name)!.push(performance.now() - start);
  }
}
const results = jobs.map(job => {
  const ms = timings.get(job.name)!.toSorted((a, b) => a - b);
  const median = ms[Math.floor(ms.length / 2)]!;
  return { name: job.name, emailsPerSecond: Math.round(iterations / median * 1000), medianMsPerEmail: median / iterations, sampleMs: ms };
});
console.table(results.map(({ name, emailsPerSecond, medianMsPerEmail }) => ({ name, emailsPerSecond, medianMsPerEmail: medianMsPerEmail.toFixed(4) })));
await writeFile('benchmarks/latest.json', JSON.stringify({ date: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, iterations, samples, fixtures: corpus.map(f => f.name), checksum, results }, null, 2) + '\n');
