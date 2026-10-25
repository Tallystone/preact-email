import assert from 'node:assert/strict';
import test from 'node:test';
import { toPlainText as upstream } from 'react-email';
import {
  toPlainText,
  textFromTree,
  render,
} from '../../../packages/email/src/index.js';
import { createElement as h, Fragment, Component } from 'preact';
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
for (const html of cases)
  for (const method of ['parser', 'regex'] as const) {
    test(`${method}: ${html.slice(0, 55)}`, () =>
      assert.equal(toPlainText(html, method), upstream(html)));
  }
test('tree evaluates pure nested functions, fragments, numeric children and raw HTML', () => {
  const Greeting = ({ name }: { name: string }) =>
    h('p', {}, 'Hello ', name, ' ', 42);
  const node = h(
    Fragment,
    {},
    h(Greeting, { name: 'Sam' }),
    h('div', { dangerouslySetInnerHTML: { __html: '<p>A &amp; B</p>' } }),
  );
  assert.equal(textFromTree(node), upstream(render(node)));
});
test('tree rejects class components', () => {
  class Example extends Component {
    render() {
      return h('p', {}, 'Class');
    }
  }
  assert.throws(() => textFromTree(h(Example, {})), /class components/);
});

for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
  test(`${tag}: preserve upstream block spacing across every text method`, () => {
    const node = h(
      'div',
      {},
      h('p', {}, 'Opening paragraph.'),
      h(tag, {}, 'Next chapter'),
      h('p', {}, 'Closing paragraph.'),
    );
    const html = render(node);
    const expected = upstream(html);
    assert.equal(toPlainText(html, 'parser'), expected);
    assert.equal(toPlainText(html, 'regex'), expected);
    assert.equal(textFromTree(node), expected);
  });
}
test('nested block boundaries merge without discarding explicit line breaks', () => {
  const node = h(
    'div',
    {},
    h('div', {}, 'One'),
    h('div', {}, 'Two'),
    h('p', {}, 'Three', h('br', {}), h('br', {}), h('br', {}), 'Four'),
  );
  const html = render(node);
  const expected = upstream(html);
  assert.equal(toPlainText(html, 'parser'), expected);
  assert.equal(toPlainText(html, 'regex'), expected);
  assert.equal(textFromTree(node), expected);
});
