import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
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
import { fixtures, makePreact, makeReact } from './fixtures.ts';
import { normalizeHtml } from './normalize.ts';
import { htmlToTextBaseline } from './html-to-text-baseline.ts';
import {
  loadTsxBenchmarkFixtures,
  type BenchmarkFixture,
} from './benchmark-fixtures.ts';

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
        cores: cpus().length,
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

  const result = (name: string) => results.find(row => row.name === name)!;
  const speedup = (upstream: string, local: string) =>
    (result(upstream).medianMsPerEmail / result(local).medianMsPerEmail).toFixed(1);
  const summary = `**${speedup('upstream HTML', 'preact HTML')}× faster HTML rendering; ${speedup('upstream HTML + text', 'preact HTML + compiled html-to-text')}× faster HTML + plain text** than React Email in the latest benchmark below.`;
  const rows = [
    ['React Email — HTML', 'upstream HTML'],
    ['Preact Email — HTML', 'preact HTML'],
    ['React Email — HTML + text', 'upstream HTML + text'],
    ['Preact Email — HTML + text', 'preact HTML + compiled html-to-text'],
  ];
  const date = JSON.parse(report).date.slice(0, 10);
  const table = [
    '| Renderer | Emails/sec | Seconds/email |',
    '| --- | ---: | ---: |',
    ...rows.map(([label, name]) => {
      const row = result(name!);
      return `| ${label} | ${row.emailsPerSecond.toLocaleString('en-US')} | ${(row.medianMsPerEmail / 1000).toFixed(6)} |`;
    }),
    '',
    `${date} · Node ${process.version} · ${cpus().length} logical cores · ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} mode.`,
    `${corpus.length} fixtures (${selection}); median of ${samples} × ${iterations.toLocaleString('en-US')} renders after warmup. Compilation excluded; HTML and text parity checked before timing. Results vary by workload.`,
  ].join('\n');
  let readme = await readFile('README.md', 'utf8');
  for (const [section, content] of [['benchmark-summary', summary], ['benchmarks', table]]) {
    const pattern = new RegExp(`<!-- ${section}:start -->[\\s\\S]*?<!-- ${section}:end -->`);
    if (!pattern.test(readme)) throw new Error(`Missing README markers for ${section}`);
    readme = readme.replace(pattern, () => `<!-- ${section}:start -->\n${content}\n<!-- ${section}:end -->`);
  }
  await writeFile('README.md', readme);
} finally {
  await tsx?.dispose();
}
