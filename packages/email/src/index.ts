export type {} from './email-attributes.js';
import { render } from './render.js';
import type { ComponentChildren } from 'preact';
import { toPlainText } from './text.js';
export * from './vendor/index.js';
export { toPlainText } from './text.js';
export { render, renderAsync, doctype } from './render.js';

/** Named preview inputs for an email component. */
export type Scenarios<Props> = Array<{ name: string; props: Props }>;

/** Render the template once, then convert its HTML to text. */
export function renderEmail(node: ComponentChildren): {
  html: string;
  text: string;
} {
  const html = render(node);
  return { html, text: toPlainText(html) };
}
