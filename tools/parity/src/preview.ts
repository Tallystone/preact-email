import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { VNode } from 'preact';
import { renderEmail } from '@hillac/preact-email';

const fixtures = fileURLToPath(new URL('../test-emails/', import.meta.url));
const output = fileURLToPath(new URL('../../../preview/', import.meta.url));
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
const links: string[] = [];
let first = '';
await mkdir(output, { recursive: true });
for (const file of (await readdir(fixtures))
  .filter((file) => file.endsWith('.tsx'))
  .sort()) {
  const email = (await import(pathToFileURL(join(fixtures, file)).href)) as {
    default: (props: Record<string, unknown>) => VNode;
    scenarios: Array<{ name: string; props: Record<string, unknown> }>;
  };
  for (const scenario of email.scenarios) {
    const name = `${file.slice(0, -4)}--${scenario.name}`.replace(
      /[^a-zA-Z0-9_-]/g,
      '-',
    );
    const { html, text } = renderEmail(email.default(scenario.props));
    await writeFile(join(output, `${name}.html`), html);
    await writeFile(join(output, `${name}.txt`), text);
    first ||= `${name}.html`;
    links.push(
      `<li><strong>${escape(file.slice(0, -4))}</strong><br>${escape(scenario.name)}<br><a href="${name}.html" target="email">Preview</a> · <a href="${name}.html" target="_blank" rel="noopener">Open</a> · <a href="${name}.txt" target="email">Text</a></li>`,
    );
  }
}
if (!first) throw new Error('No email scenarios found');
await writeFile(
  join(output, 'index.html'),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test emails</title>
<style>
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;color:#203b38;display:flex;height:100vh}
nav{width:300px;flex-shrink:0;overflow:auto;padding:24px;background:#f1f6f3;border-right:1px solid #ceded6}
h1{font-size:22px;margin:0 0 8px}p{color:#586e6b}ul{list-style:none;padding:0}li{margin:20px 0;overflow-wrap:anywhere}a{color:#16756b}
iframe{flex:1;width:100%;border:0;background:white}@media(max-width:700px){body{display:block;height:auto}nav{width:100%;max-height:35vh}iframe{height:80vh}}
</style></head><body><nav><h1>Test emails</h1><p>${links.length} scenarios rendered with Preact. Select a preview or open it separately.</p><p>Images use placeholder URLs.</p><ul>${links.join('\n')}</ul></nav><iframe name="email" title="Email preview" src="${first}"></iframe></body></html>`,
);
console.log(
  `Rendered ${links.length} email scenarios. Open ${join(output, 'index.html')}`,
);
