import { readFile } from 'node:fs/promises';
import type { Plugin } from 'esbuild';
import { Parser } from 'htmlparser2';

// Instrument only the dev preview bundle. Published components and parity
// renders retain their original markup.
export const previewMetadataPlugin: Plugin = {
  name: 'preview-metadata',
  setup(build) {
    build.onLoad(
      { filter: /[\\/]vendor[\\/]preview[\\/]preview\.(tsx|js)$/ },
      async ({ path }) => {
        const source = await readFile(path, 'utf8');
        const contents = path.endsWith('.tsx')
          ? source.replace('ref={ref}', 'data-email-preview="" ref={ref}')
          : source.replace(/ref:\s*ref\b/, '"data-email-preview": "", ref: ref');
        return { contents, loader: path.endsWith('.tsx') ? 'tsx' : 'js' };
      },
    );
  },
};

// Preview accepts string children; its nested div is invisible padding.
// Collect direct text only, decoding entities without including that padding.
export function extractPreview(html: string): string | undefined {
  let depth = 0;
  let previewDepth: number | undefined;
  let text: string | undefined;
  new Parser({
    onopentag(_tag, attrs) {
      depth++;
      if (text === undefined && 'data-email-preview' in attrs) {
        previewDepth = depth;
        text = '';
      }
    },
    ontext(value) {
      if (depth === previewDepth) text += value;
    },
    onclosetag() {
      if (depth === previewDepth) previewDepth = undefined;
      depth--;
    },
  }).end(html);
  return text;
}
