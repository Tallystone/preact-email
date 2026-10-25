import assert from 'node:assert/strict';
import test from 'node:test';
import { toPlainText as upstream } from 'react-email';
import {
  toPlainText,
  render,
  renderEmail,
} from '../../../packages/email/dist/index.js';
import { createElement as h, Component } from 'preact';
const cases = [
  '<p>one  <b> two </b> three</p>',
  '<p>A&nbsp;B &copy; &#x1F680; &#39; &lt;tag&gt;</p>',
  '<div>before<br><br>after</div>',
  '<ul><li>One</li><li>Two</li></ul>',
  '<ol start="3"><li>One</li><li>Two</li></ol>',
  '<pre>  const x = 1;\n    x++;</pre>',
  '<p>A</p><div data-skip-in-text="true"><p>hidden</p></div><p>B</p>',
  '<p><a href="mailto:a@example.com">Email</a> <a href="#local">Local</a></p>',
  '<p><a href="https://example.com" title="a > b">A &amp; B</a></p>',
  '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>',
  '<p>Hello</p><script>console.log(1)</script><style>p { color:red }</style>',
];

for (const html of cases) {
  test(`compiled: ${html.slice(0, 55)}`, () =>
    assert.equal(toPlainText(html), upstream(html)));
}
test('combined output evaluates the template once and preserves literal input', () => {
  let calls = 0;
  const content = 'Map <Edition> & "Guide"';
  function Example() {
    calls++;
    return h('p', {}, content);
  }
  const result = renderEmail(h(Example, {}));
  assert.equal(calls, 1);
  assert.equal(result.text, content);
  assert.match(result.html, /&lt;Edition(?:&gt;|>)/);
});
test('class components use the normal Preact renderer', () => {
  class Example extends Component {
    render() {
      return h('p', {}, 'Class');
    }
  }
  assert.equal(renderEmail(h(Example, {})).text, 'Class');
});
for (const html of [
  '<ul><li>Outer<ul><li>Nested</li></ul></li><li>Last</li></ul>',
  '<table data-text-format="dataTable"><tr><th>Item</th><th>Qty</th></tr><tr><td>Journal</td><td>2</td></tr></table>',
  ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) =>
    render(
      h(
        'div',
        {},
        h('p', {}, 'Before'),
        h(tag, {}, 'Heading'),
        h('p', {}, 'After'),
      ),
    ),
  ),
]) {
  test(`format parity: ${html.slice(0, 90)}`, () =>
    assert.equal(toPlainText(html), upstream(html)));
}
