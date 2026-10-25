import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { extractPreview, previewMetadataPlugin } from '../../../packages/email-preview/src/preview-metadata.ts';

test('dev Preview metadata handles nested components, entities, title opt-out and padding', async () => {
  const result = await build({
    stdin: {
      contents: `
        import { h } from 'preact';
        import { Preview } from './packages/email/src/vendor/preview/preview.tsx';
        import { render } from './packages/email/src/render.ts';
        const Nested = () => h(Preview, { useTitleTag: false }, 'A < B & C');
        module.exports = render(h('div', {}, h('title', {}, 'Not the preheader'), h(Nested, {})));
      `,
      resolveDir: process.cwd(),
    },
    alias: { preact: './packages/email/node_modules/preact' },
    plugins: [previewMetadataPlugin],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
  });
  const module = { exports: '' };
  new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(
    createRequire(import.meta.url),
    module,
    module.exports,
  );
  assert.equal(extractPreview(module.exports), 'A < B & C');
  assert.equal(
    extractPreview(
      '<title>Page title</title><div data-skip-in-text="true">Hidden</div>',
    ),
    undefined,
  );
});
