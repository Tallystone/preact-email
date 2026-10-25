import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

test('text converter compiles on first conversion and is reused', async () => {
  const result = await build({
    stdin: {
      contents: `
        import { toPlainText } from './packages/email/src/text.ts';
        import { calls } from 'html-to-text';
        module.exports = { toPlainText, calls: () => calls };
      `,
      resolveDir: process.cwd(),
    },
    plugins: [
      {
        name: 'count-compilation',
        setup(build) {
          build.onResolve({ filter: /^html-to-text$/ }, () => ({
            path: 'converter',
            namespace: 'mock',
          }));
          build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
            contents:
              'export let calls = 0; export function compile() { calls++; return html => html; }',
          }));
        },
      },
    ],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
  });
  const module = {
    exports: {} as {
      toPlainText: (html: string) => string;
      calls: () => number;
    },
  };
  new Function('module', result.outputFiles[0]!.text)(module);
  assert.equal(module.exports.calls(), 0);
  module.exports.toPlainText('First');
  assert.equal(module.exports.calls(), 1);
  module.exports.toPlainText('Second');
  assert.equal(module.exports.calls(), 1);
});
