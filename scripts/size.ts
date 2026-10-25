import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
const results = [];
for (const variant of ['preact HTML', 'preact HTML + text', 'upstream HTML', 'upstream HTML + text']) {
  const local = variant.startsWith('preact');
  const text = variant.includes('+ text');
  const contents = local
    ? `import { createElement } from 'preact'; import { Text } from './packages/email/dist/components.js'; import { ${text ? 'renderEmail' : 'render'} } from './packages/email/dist/${text ? 'index' : 'render'}.js'; export const email = () => ${text ? 'renderEmail' : 'render'}(createElement(Text, null, 'Hello'));`
    : `import { createElement } from 'react'; import { Text, render, toPlainText } from 'react-email'; export const email = async () => { const html = await render(createElement(Text, null, 'Hello')); return ${text ? '{ html, text: toPlainText(html) }' : 'html'}; };`;
  const result = await build({ stdin: { contents, resolveDir: process.cwd() }, alias: local ? { preact: './packages/email/node_modules/preact' } : {}, bundle: true, minify: true, platform: 'node', format: 'esm', target: 'node22', write: false, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
  assert(result.outputFiles && result.metafile);
  const output = result.outputFiles[0]!.contents;
  if (local) assert(!Object.keys(result.metafile.inputs).some(p => /node_modules\/(?:react|react-dom|react-email|html-to-text)\//.test(p)), 'Upstream dependency leaked into core bundle');
  results.push({ variant, bytes: output.length, gzipBytes: gzipSync(output).length, bundledModules: Object.keys(result.metafile.inputs).length });
}
console.table(results);
await writeFile('benchmarks/size.json', JSON.stringify(results, null, 2) + '\n');
