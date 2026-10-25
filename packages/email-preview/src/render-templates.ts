import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
          const examples = Component.Scenarios ?? module.scenarios;
          const scenarios = examples?.length ? examples : [{ name: 'preview', props: Component.PreviewProps ?? {} }];
          const seen = new Set();
          const output = [];
          for (const scenario of scenarios) {
            const name = String(scenario.name ?? 'preview');
            if (seen.has(name)) throw new Error(template + ': duplicate scenario ' + name);
            seen.add(name);
            const meta = { id: template + '--' + name, template, name };
            try {
              const input = scenario.props ?? {};
              const props = Component.Schema ? await Component.Schema.parseAsync(input) : input;
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
        export async function loadEmails() { return [${entries.join(',')}].flat(); }
      `,
    },
    absWorkingDir: projectDir,
    plugins: [previewMetadataPlugin, {
      name: 'email-esm',
      setup(builder) {
        // Keep the consumer's tsconfig path resolution while compiling email JSX
        // as Preact, even when the surrounding application uses React.
        // Keep installed dependencies as native ESM/CJS modules. Bundling them
        // rewrites import.meta.url and breaks createRequire and relative assets.
        builder.onResolve({ filter: /^[^./]|^\// }, async args => {
          if (args.pluginData?.resolving) return;
          if (args.path.startsWith('node:')) return { path: args.path, external: true };
          const resolved = await builder.resolve(args.path, {
            resolveDir: args.resolveDir, kind: args.kind,
            pluginData: { resolving: true },
          });
          if (resolved.errors.length) return { errors: resolved.errors };
          if (resolved.path.split(/[\\/]/).includes('node_modules')) {
            // The core Preview component is instrumented by the preceding plugin.
            if (/[/\\]@tallystone[/\\]preact-email[/\\]/.test(resolved.path)) return;
            return { path: pathToFileURL(resolved.path).href, external: true };
          }
        });
        builder.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async ({ path }) => {
          const result = await transform(await readFile(path, 'utf8'), {
            loader: path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'ts' : 'jsx',
            sourcefile: path,
            define: { 'import.meta.url': JSON.stringify(pathToFileURL(path).href) },
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
    format: 'esm',
    target: 'node22',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    logLevel: 'silent',
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0]!.text).toString('base64');
  const module = await import(url) as { loadEmails(): Promise<EmailPreview[]> };
  const emails = (await module.loadEmails()).map(email => ({ ...email, preview: extractPreview(email.html) }));
  return {
    emails,
    dependencies: Object.keys(result.metafile!.inputs).filter(path => path !== '<stdin>').map(path => resolve(projectDir, path)),
  };
}
