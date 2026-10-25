import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement as rh } from 'react';
import { createElement as ph } from 'preact';
import * as upstream from 'react-email';
import { Markdown } from '../../../packages/email-extras/dist/vendor/markdown/index.js';
import { CodeBlock, dracula } from '../../../packages/email-extras/dist/vendor/code-block/index.js';
import { Tailwind } from '../../../packages/email-extras/dist/vendor/tailwind/index.js';
import { render, renderAsync, toPlainText, Html, Head, Body, Text, Button } from '../../../packages/email/dist/index.js';
import { normalizeHtml } from './normalize.ts';
test('optional Markdown HTML and text parity', async () => {
  const source = '# Hello\n\nA **bold** paragraph and [link](https://example.com).\n\n- First\n- Second';
  const actual = render(ph(Markdown, { children: source }));
  const expected = await upstream.render(rh(upstream.Markdown, { children: source }));
  assert.deepEqual(normalizeHtml(actual), normalizeHtml(expected));
  assert.equal(toPlainText(actual), upstream.toPlainText(expected));
});
test('optional CodeBlock HTML and text parity', async () => {
  const props = { code: 'const value = 42;\nconsole.log(value);', language: 'javascript' as const, theme: dracula };
  const actual = render(ph(CodeBlock, props));
  const expected = await upstream.render(rh(upstream.CodeBlock, props));
  assert.deepEqual(normalizeHtml(actual), normalizeHtml(expected));
  assert.equal(toPlainText(actual), upstream.toPlainText(expected));
});
test('optional Tailwind async compilation and component styles match upstream', async () => {
  const actual = await renderAsync(ph(Tailwind, { children: ph(Html, {}, ph(Head, {}), ph(Body, {}, ph(Text, { className: 'text-red-500 text-lg' }, 'Hello'), ph(Button, { className: 'px-4 py-2', href: 'https://example.com' }, 'Open'))) }));
  const expected = await upstream.render(rh(upstream.Tailwind, { children: rh(upstream.Html, {}, rh(upstream.Head, {}), rh(upstream.Body, {}, rh(upstream.Text, { className: 'text-red-500 text-lg' }, 'Hello'), rh(upstream.Button, { className: 'px-4 py-2', href: 'https://example.com' }, 'Open'))) }));
  assert.deepEqual(normalizeHtml(actual), normalizeHtml(expected));
  assert.equal(toPlainText(actual), upstream.toPlainText(expected));
});
