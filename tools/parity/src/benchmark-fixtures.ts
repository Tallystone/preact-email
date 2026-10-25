import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import type { ReactElement } from 'react';
import type { VNode } from 'preact';

export interface BenchmarkFixture {
  name: string;
  react: () => ReactElement;
  preact: () => VNode;
}
interface EmailModule<T> {
  default: (props: Record<string, unknown>) => T;
  scenarios: { name: string; props: Record<string, unknown> }[];
}

/** Compile before timing; both runtimes use exactly the same TSX and props. */
export async function loadTsxBenchmarkFixtures(): Promise<{
  fixtures: BenchmarkFixture[];
  dispose: () => Promise<void>;
}> {
  const workspace = fileURLToPath(new URL('../', import.meta.url));
  const source = join(workspace, 'test-emails');
  const output = await mkdtemp(join(workspace, '.email-fixtures-'));
  const dispose = () => rm(output, { recursive: true, force: true });
  try {
    const files = (await readdir(source))
      .filter((file) => file.endsWith('.tsx'))
      .sort();
    for (const runtime of ['react', 'preact'] as const) {
      await build({
        entryPoints: files.map((file) => join(source, file)),
        outdir: join(output, runtime),
        outExtension: { '.js': '.mjs' },
        bundle: true,
        packages: 'external',
        platform: 'node',
        format: 'esm',
        target: 'node22',
        jsx: 'automatic',
        jsxImportSource: runtime,
        tsconfigRaw: {
          compilerOptions: { jsx: 'react-jsx', jsxImportSource: runtime },
        },
        alias: {
          '@hillac/preact-email':
            runtime === 'react'
              ? 'react-email'
              : fileURLToPath(
                  new URL(
                    '../../../packages/email/dist/index.js',
                    import.meta.url,
                  ),
                ),
        },
        absWorkingDir: workspace,
        logLevel: 'silent',
      });
    }
    const fixtures: BenchmarkFixture[] = [];
    for (const file of files) {
      const name = file.replace(/\.tsx$/, '.mjs');
      const react = (await import(
        pathToFileURL(join(output, 'react', name)).href
      )) as EmailModule<ReactElement>;
      const preact = (await import(
        pathToFileURL(join(output, 'preact', name)).href
      )) as EmailModule<VNode>;
      assert.deepEqual(preact.scenarios, react.scenarios);
      for (const scenario of react.scenarios)
        fixtures.push({
          name: `${file}/${scenario.name}`,
          react: () => react.default(scenario.props),
          preact: () => preact.default(scenario.props),
        });
    }
    assert(fixtures.length > 0);
    return { fixtures, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
