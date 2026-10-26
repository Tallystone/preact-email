import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHtml } from './normalize.ts';

const style = (css: string) => `<div style="${css}"></div>`;

test('normalization permits only the required inline CSS serialization differences', () => {
  assert.deepEqual(
    normalizeHtml(style('margin:0px;padding:0px;max-height:0px;max-width:0px;')),
    normalizeHtml(style('margin:0;padding:0;max-height:0;max-width:0')),
  );
});

const differences: Array<[string, string, string]> = [
  ['CSS declaration order', style('color:red;color:blue'), style('color:blue;color:red')],
  ['CSS duplicates', style('color:red;color:red'), style('color:red')],
  ['CSS empty declarations', style('color:red;;'), style('color:red;')],
  ['CSS whitespace', style('color: red'), style('color:red')],
  ['custom properties', style('--offset:0px'), style('--offset:0')],
  ['quoted CSS text', style("content:'a 0px b'"), style("content:'a 0 b'")],
  ['CSS function values', style('width:calc(0px + 1px)'), style('width:calc(0 + 1px)')],
  ['unlisted zero lengths', style('width:0px'), style('width:0')],
  ['style block escaping', '<style>a[data-theme="dark"] { color: red; }</style>', '<style>a[data-theme=&quot;dark&quot;] { color: red; }</style>'],
  ['text whitespace', '<p>a  b</p>', '<p>a b</p>'],
  ['text line breaks', '<p>a\nb</p>', '<p>a b</p>'],
  ['attribute values', '<a href="/one">link</a>', '<a href="/two">link</a>'],
  ['element order', '<b>a</b><i>b</i>', '<i>b</i><b>a</b>'],
  ['doctype', '<!DOCTYPE html><p>a</p>', '<p>a</p>'],
  ['conditional comments', '<!--[if mso]>one<![endif]-->', '<!--[if mso]>two<![endif]-->'],
  ['comments versus literal text', '<!--note-->', '&lt;!--note--&gt;'],
  ['failed suspense boundary', '<!--$!--><p>a</p><!--/$-->', '<!--$--><p>a</p><!--/$-->'],
];

for (const [name, left, right] of differences) {
  test(`normalization preserves differences in ${name}`, () => {
    assert.notDeepEqual(normalizeHtml(left), normalizeHtml(right));
  });
}
