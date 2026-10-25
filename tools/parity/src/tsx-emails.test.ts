import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import type { ReactElement } from 'react';
import type { VNode } from 'preact';
import {
  render as upstreamRender,
  toPlainText as upstreamText,
} from 'react-email';
import {
  doctype,
  render,
  renderAsync,
  renderEmail,
  toPlainText,
} from '../../../packages/email/dist/index.js';
import { htmlToTextBaseline } from './html-to-text-baseline.ts';
import { normalizeHtml } from './normalize.ts';
import previewPlugins from '../../../scripts/react-email-preview.ts';

interface Scenario {
  name: string;
  props: Record<string, unknown>;
  contains: string[];
  excludes: string[];
  htmlContains?: string[];
  htmlExcludes?: string[];
}
interface EmailModule<Node> {
  default: ((props: Record<string, unknown>) => Node) & {
    PreviewProps: Record<string, unknown>;
  };
  scenarios: Scenario[];
}
const workspace = fileURLToPath(new URL('../', import.meta.url));
const fixtureDir = join(workspace, 'test-emails');

// Compile the same ordinary TSX twice: genuine React JSX + upstream components,
// and genuine Preact JSX + local components. No VNode conversion or mocked JSX.
test('standalone TSX email parity', async (t) => {
  const files = (await readdir(fixtureDir))
    .filter((name) => name.endsWith('.tsx'))
    .sort();
  assert(files.length >= 4, 'Expected the standalone fixture collection');
  const output = await mkdtemp(join(workspace, '.email-fixtures-'));
  try {
    for (const runtime of ['react', 'preact'] as const) {
      await build({
        entryPoints: files.map((name) => join(fixtureDir, name)),
        outdir: join(output, runtime),
        outExtension: { '.js': '.mjs' },
        bundle: true,
        packages: 'external',
        platform: 'node',
        format: 'esm',
        target: 'node22',
        jsx: 'automatic',
        jsxImportSource: 'preact',
        plugins: runtime === 'react' ? previewPlugins : [],
        tsconfigRaw: {
          compilerOptions: { jsx: 'react-jsx', jsxImportSource: runtime },
        },
        alias: {
          '@hillac/preact-email': fileURLToPath(
            new URL('../../../packages/email/src/index.ts', import.meta.url),
          ),
        },
        // Resolve bare external imports from the parity workspace, where Preact
        // and the workspace package are explicitly declared dependencies.
        absWorkingDir: workspace,
        logLevel: 'silent',
      });
    }
    for (const file of files) {
      const filename = file.replace(/\.tsx$/, '.mjs');
      const reactModule = (await import(
        pathToFileURL(join(output, 'react', filename)).href
      )) as EmailModule<ReactElement>;
      const preactModule = (await import(
        pathToFileURL(join(output, 'preact', filename)).href
      )) as EmailModule<VNode>;
      assert.equal(typeof reactModule.default, 'function');
      assert.equal(typeof preactModule.default, 'function');
      assert(
        reactModule.scenarios.length >= 2,
        `${file} must cover optional branches`,
      );
      assert.deepEqual(preactModule.scenarios, reactModule.scenarios);
      assert.deepEqual(
        reactModule.default.PreviewProps,
        reactModule.scenarios[0]!.props,
      );
      assert.deepEqual(
        preactModule.default.PreviewProps,
        preactModule.scenarios[0]!.props,
      );
      for (const scenario of reactModule.scenarios) {
        await t.test(`${file}: ${scenario.name}`, async (scenarioTest) => {
          const reactNode = () => reactModule.default(scenario.props);
          const preactNode = () => preactModule.default(scenario.props);
          const expectedHtml = await upstreamRender(reactNode());
          const expectedText = await upstreamRender(reactNode(), {
            plainText: true,
          });
          assert.equal(upstreamText(expectedHtml), expectedText);
          assert(
            expectedText.length > 100,
            'Fixture must produce meaningful text',
          );
          for (const text of scenario.contains)
            assert(
              expectedText.includes(text),
              `Missing reference text: ${text}`,
            );
          for (const text of scenario.excludes)
            assert(
              !expectedText.includes(text),
              `Unexpected reference text: ${text}`,
            );
          const actualHtml = render(preactNode());
          for (const html of [expectedHtml, actualHtml]) {
            for (const value of scenario.htmlContains ?? [])
              assert(html.includes(value), `Missing expected markup: ${value}`);
            for (const value of scenario.htmlExcludes ?? [])
              assert(!html.includes(value), `Unexpected markup: ${value}`);
          }
          await scenarioTest.test('HTML matches upstream', () => {
            assert(actualHtml.startsWith(doctype));
            assert.deepEqual(
              normalizeHtml(actualHtml),
              normalizeHtml(expectedHtml),
            );
          });
          await scenarioTest.test('async HTML matches upstream', async () => {
            assert.deepEqual(
              normalizeHtml(await renderAsync(preactNode())),
              normalizeHtml(expectedHtml),
            );
          });
          await scenarioTest.test(
            'compiled text matches upstream exactly',
            () => {
              const result = renderEmail(preactNode());
              assert.equal(result.text, expectedText);
              assert.equal(toPlainText(actualHtml), expectedText);
              assert.deepEqual(
                normalizeHtml(result.html),
                normalizeHtml(expectedHtml),
              );
            },
          );
          await scenarioTest.test(
            'upstream html-to-text on Preact HTML matches exactly',
            () => {
              assert.equal(htmlToTextBaseline(actualHtml), expectedText);
            },
          );
        });
      }
    }
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
