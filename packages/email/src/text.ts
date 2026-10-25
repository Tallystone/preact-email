import { compile } from 'html-to-text';

// Match React Email's default text options without importing its runtime.
// Preact leaves Preview's title in the body instead of hoisting it into head.
const convert = compile({
  wordwrap: false,
  selectors: [
    { selector: 'img', format: 'skip' },
    { selector: '[data-skip-in-text=true]', format: 'skip' },
    {
      selector: 'a',
      options: { linkBrackets: false, hideLinkHrefIfSameAsText: true },
    },
    { selector: '[data-text-format="dataTable"]', format: 'dataTable' },
    { selector: 'title', format: 'skip' },
  ],
});

/** Convert rendered HTML using one shared, precompiled html-to-text converter. */
export function toPlainText(html: string): string {
  return convert(html);
}
