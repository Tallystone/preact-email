import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { build, transform } from 'esbuild';
import { discoverTemplates, templateName } from './discover.ts';
import { extractPreview, previewMetadataPlugin } from './preview-metadata.ts';

export interface EmailPreview {
  id: string;
  template: string;
  name: string;
  html: string;
  text: string;
  subject?: string;
  preview?: string;
  error?: string;
}

export async function renderTemplates(directory: string, projectDir: string): Promise<{
  emails: EmailPreview[];
  dependencies: string[];
}> {
  const files = await discoverTemplates(directory);
  if (!files.length) return { emails: [], dependencies: [] };
  const require = createRequire(join(projectDir, 'package.json'));
  const preactDir = dirname(require.resolve('preact/package.json'));
  const imports = files.map((file, i) => `import * as email${i} from ${JSON.stringify(file)};`);
  const entries = files.map((file, i) => `await load(email${i}, ${JSON.stringify(templateName(directory, file))})`);
  const result = await build({
    stdin: {
      resolveDir: projectDir,
      contents: `
        import { h } from 'preact';
        import { renderAsync, toPlainText } from '@tallystone/preact-email';
        ${imports.join('\n')}
        async function load(module, template) {
          const Component = module.default;
          if (typeof Component !== 'function') return [];
          const scenarios = module.scenarios?.length ? module.scenarios : [{ name: 'preview', props: Component.PreviewProps ?? {} }];
          const seen = new Set();
          const output = [];
          for (const scenario of scenarios) {
            const name = String(scenario.name ?? 'preview');
            if (seen.has(name)) throw new Error(template + ': duplicate scenario ' + name);
            seen.add(name);
            const meta = { id: template + '--' + name, template, name };
            try {
              const props = scenario.props ?? {};
              const subject = typeof Component.Subject === 'function' ? await Component.Subject(props) : undefined;
              if (subject !== undefined && typeof subject !== 'string') throw new Error('Subject must return a string');
              const html = await renderAsync(h(Component, props));
              output.push({ ...meta, subject, html, text: toPlainText(html) });
            } catch (error) {
              output.push({ ...meta, html: '', text: '', error: error instanceof Error ? error.message : String(error) });
            }
          }
          return output;
        }
        module.exports = (async () => [${entries.join(',')}].flat())();
      `,
    },
    absWorkingDir: projectDir,
    plugins: [previewMetadataPlugin, {
      name: 'preact-email-jsx',
      setup(builder) {
        // Keep the consumer's tsconfig path resolution while compiling email JSX
        // as Preact, even when the surrounding application uses React.
        builder.onLoad({ filter: /\.[jt]sx$/ }, async ({ path }) => {
          const result = await transform(await readFile(path, 'utf8'), {
            loader: path.endsWith('.tsx') ? 'tsx' : 'jsx',
            sourcefile: path,
            jsx: 'automatic',
            jsxImportSource: 'preact',
            target: 'node22',
          });
          return { contents: result.code, loader: 'js' };
        });
      },
    }],
    alias: { preact: preactDir },
    bundle: true,
    write: false,
    metafile: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    logLevel: 'silent',
  });
  const module = { exports: undefined as unknown as Promise<EmailPreview[]> };
  new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(require, module, module.exports);
  const emails = (await module.exports).map(email => ({ ...email, preview: extractPreview(email.html) }));
  return {
    emails,
    dependencies: Object.keys(result.metafile!.inputs).filter(path => path !== '<stdin>').map(path => resolve(projectDir, path)),
  };
}
