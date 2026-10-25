import { toPlainText } from 'react-email';

// Preact does not hoist Preview's <title> to <head>. Ignore it explicitly,
// using identical html-to-text options for both renderer benchmarks.
export const htmlToTextBaseline = (html: string): string =>
  toPlainText(html, { selectors: [{ selector: 'title', format: 'skip' }] });
