import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import {
  render as upstreamRender,
  toPlainText as upstreamText,
} from 'react-email';
import {
  render,
  renderEmail,
  toPlainText,
} from '../../../packages/email/dist/index.js';
import { fixtures, makePreact, makeReact } from './fixtures.js';
import { normalizeHtml } from './normalize.js';
import { htmlToTextBaseline } from './html-to-text-baseline.js';
import {
  loadTsxBenchmarkFixtures,
  type BenchmarkFixture,
} from './benchmark-fixtures.js';

const iterations = Number(process.env.BENCH_ITERATIONS ?? 200);
const samples = Number(process.env.BENCH_SAMPLES ?? 5);
if (
  !Number.isInteger(iterations) ||
  iterations < 1 ||
  !Number.isInteger(samples) ||
  samples < 1
)
  throw new Error('Benchmark counts must be positive integers');
const selection = process.env.BENCH_CORPUS ?? 'all';
if (!['all', 'compact', 'tsx'].includes(selection))
  throw new Error('BENCH_CORPUS must be all, compact, or tsx');
const tsx =
  selection === 'compact' ? undefined : await loadTsxBenchmarkFixtures();
try {
  const input: BenchmarkFixture[] = [
    ...(selection === 'tsx'
      ? []
      : fixtures.map((f) => ({
          name: f.name,
          react: () => makeReact(f.spec),
          preact: () => makePreact(f.spec),
        }))),
    ...(tsx?.fixtures ?? []),
  ];
  const corpus = await Promise.all(
    input.map(async (f) => {
      const html = await upstreamRender(f.react());
      const text = upstreamText(html);
      assert.equal(htmlToTextBaseline(html), text);
      assert.equal(toPlainText(html), text);
      const local = render(f.preact());
      assert.deepEqual(normalizeHtml(local), normalizeHtml(html));
      assert.equal(htmlToTextBaseline(local), text);
      assert.equal(toPlainText(local), text);
      assert.equal(renderEmail(f.preact()).text, text);
      return { ...f, html, text };
    }),
  );
  console.log(
    `Benchmarking ${corpus.length} ${selection} fixtures; ${samples} samples of ${iterations} emails per method (production mode: ${process.env.NODE_ENV === 'production'}).`,
  );
  let checksum = 0;
  type Job = { name: string; run: (i: number) => number | Promise<number> };
  const at = (i: number) => corpus[i % corpus.length]!;
  const jobs: Job[] = [
    {
      name: 'upstream HTML',
      run: async (i) => (await upstreamRender(at(i).react())).length,
    },
    { name: 'preact HTML', run: (i) => render(at(i).preact()).length },
    {
      name: 'upstream HTML + text',
      run: async (i) => {
        const html = await upstreamRender(at(i).react());
        return html.length + htmlToTextBaseline(html).length;
      },
    },
    {
      name: 'preact HTML + upstream html-to-text',
      run: (i) => {
        const html = render(at(i).preact());
        return html.length + htmlToTextBaseline(html).length;
      },
    },
    {
      name: 'upstream HTML + compiled html-to-text',
      run: async (i) => {
        const html = await upstreamRender(at(i).react());
        return html.length + toPlainText(html).length;
      },
    },
    {
      name: 'preact HTML + compiled html-to-text',
      run: (i) => {
        const result = renderEmail(at(i).preact());
        return result.html.length + result.text.length;
      },
    },
    {
      name: 'upstream text only (pre-rendered HTML)',
      run: (i) => htmlToTextBaseline(at(i).html).length,
    },
    {
      name: 'compiled html-to-text only (pre-rendered HTML)',
      run: (i) => toPlainText(at(i).html).length,
    },
  ];
  const timings = new Map(jobs.map((j) => [j.name, [] as number[]]));
  for (const job of jobs)
    for (let i = 0; i < 50; i++) checksum += await job.run(i);
  // Rotate job order between samples to reduce order/thermal bias. Time sync loops
  // without adding a Promise per render; only upstream's async API is awaited.
  for (let sample = 0; sample < samples; sample++) {
    console.log(`Sample ${sample + 1}/${samples}`);
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
  const results = jobs.map((job) => {
    const ms = timings.get(job.name)!.toSorted((a, b) => a - b);
    const median = ms[Math.floor(ms.length / 2)]!;
    return {
      name: job.name,
      emailsPerSecond: Math.round((iterations / median) * 1000),
      medianMsPerEmail: median / iterations,
      sampleMs: ms,
    };
  });
  console.table(
    results.map(({ name, emailsPerSecond, medianMsPerEmail }) => ({
      name,
      emailsPerSecond,
      medianMsPerEmail: medianMsPerEmail.toFixed(4),
    })),
  );
  const report =
    JSON.stringify(
      {
        date: new Date().toISOString(),
        node: process.version,
        cpu: cpus()[0]?.model,
        selection,
        iterations,
        samples,
        fixtures: corpus.map((f) => f.name),
        checksum,
        results,
      },
      null,
      2,
    ) + '\n';
  await writeFile('benchmarks/latest.json', report);
  await writeFile(`benchmarks/latest-${selection}.json`, report);
} finally {
  await tsx?.dispose();
}
