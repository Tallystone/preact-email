import assert from 'node:assert/strict';
import test from 'node:test';
import {
  render as upstreamRender,
  toPlainText as upstreamText,
} from 'react-email';
import { render, renderEmail } from '../../../packages/email/src/index.js';
import { fixtures, makePreact, makeReact } from './fixtures.js';
import { normalizeHtml } from './normalize.js';
import { htmlToTextBaseline } from './html-to-text-baseline.js';

for (const fixture of fixtures) {
  test(`${fixture.name}: HTML parity`, async () => {
    const actual = render(makePreact(fixture.spec));
    const expected = await upstreamRender(makeReact(fixture.spec));
    assert.deepEqual(normalizeHtml(actual), normalizeHtml(expected));
  });
  test(`${fixture.name}: Preact + upstream html-to-text parity`, async () => {
    const expectedHtml = await upstreamRender(makeReact(fixture.spec));
    const expectedText = upstreamText(expectedHtml);
    assert.equal(htmlToTextBaseline(expectedHtml), expectedText);
    assert.equal(
      htmlToTextBaseline(render(makePreact(fixture.spec))),
      expectedText,
    );
  });
  test(`${fixture.name}: compiled plain text matches upstream exactly`, async () => {
    const expected = upstreamText(
      await upstreamRender(makeReact(fixture.spec)),
    );
    assert.equal(renderEmail(makePreact(fixture.spec)).text, expected);
  });
}
