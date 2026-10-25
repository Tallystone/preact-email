import { createElement as reactElement, type ElementType, type ReactElement } from 'react';
import { createElement as preactElement, type ComponentType, type VNode } from 'preact';
import * as upstream from 'react-email';
import * as local from '../../../packages/email/src/index.js';

type Spec = string | number | { tag: string; props?: Record<string, unknown>; children?: Spec[] };
const e = (tag: string, props: Record<string, unknown> = {}, ...children: Spec[]): Spec => ({ tag, props, children });
const document = (...children: Spec[]) => e('Html', {}, e('Head'), e('Body', { style: { backgroundColor: '#fff', margin: 0 } }, e('Container', {}, ...children)));
export const fixtures: { name: string; spec: Spec }[] = [
  { name: 'notification', spec: document(e('Preview', {}, 'Your documents are ready'), e('Heading', {}, 'Upload complete'), e('Text', {}, 'Hello ', e('b', {}, 'John'), ', your documents are ready.'), e('Button', { href: 'https://example.com/work/42', style: { padding: '12px 24px', backgroundColor: '#111', color: '#fff' } }, 'View work item'), e('Text', {}, 'Contact ', e('Link', { href: 'mailto:support@example.com' }, 'support@example.com'), '.')) },
  { name: 'receipt', spec: document(e('Heading', { as: 'h2' }, 'Receipt & details'), e('Section', {}, e('Row', {}, e('Column', {}, 'Item'), e('Column', {}, 'Price')), e('Row', {}, e('Column', {}, 'Coffee'), e('Column', {}, '$4.50'))), e('Hr'), e('Text', {}, 'Thanks for your order!')) },
  { name: 'links-entities', spec: document(e('Text', {}, 'A & B < C > D “quoted” café 😀'), e('Link', { href: 'https://example.com' }, 'https://example.com'), e('br'), e('Link', { href: 'https://example.com?a=1&b=2' }, 'Open'), e('Text', {}, e('Link', { href: '#details' }, 'Details'))) },
  { name: 'preview-image-skips', spec: document(e('Preview', { useTitleTag: false }, 'Do not show in text'), e('Img', { src: 'https://example.com/logo.png', width: 80, height: 30, alt: 'Logo' }), e('div', { 'data-skip-in-text': true }, e('Text', {}, 'Hidden')), e('Text', {}, 'Visible')) },
  { name: 'typography', spec: document(e('Heading', { as: 'h3', mx: 12 }, 'A heading'), e('Text', { style: { margin: '8px 12px', fontSize: 16 } }, 'Run ', e('CodeInline', {}, 'pnpm install'), ' now.'), e('div', {}, 'First', e('br'), 'Second')) },
  { name: 'raw-html', spec: document(e('div', { dangerouslySetInnerHTML: { __html: '<p>A &amp; B</p><!--comment--><p>Second <a href="https://example.com">link</a></p>' } })) },
  { name: 'font-head', spec: e('Html', { lang: 'fr' }, e('Head', {}, e('Font', { fontFamily: 'Roboto', fallbackFontFamily: 'Arial', webFont: { url: 'https://example.com/font.woff2', format: 'woff2' }, fontWeight: 400, fontStyle: 'normal' })), e('Body', {}, e('Text', {}, 'Bonjour'))) },
  { name: 'long-email', spec: document(...Array.from({ length: 40 }, (_, i) => e('Text', {}, `Update ${i}: `, e('Link', { href: `https://example.com/${i}` }, 'View details'), ' & continue.'))) },
];
export function makeReact(spec: Spec): ReactElement {
  function visit(s: Spec): ReactElement | string | number {
    if (typeof s !== 'object') return s;
    const component = (upstream as unknown as Record<string, ElementType>)[s.tag] ?? s.tag;
    return reactElement(component, s.props, ...(s.children ?? []).map(visit));
  }
  return visit(spec) as ReactElement;
}
export function makePreact(spec: Spec): VNode {
  function visit(s: Spec): VNode | string | number {
    if (typeof s !== 'object') return s;
    const component = (local as unknown as Record<string, ComponentType<Record<string, unknown>>>)[s.tag] ?? s.tag;
    return preactElement(component, s.props ?? {}, ...(s.children ?? []).map(visit));
  }
  return visit(spec) as VNode;
}
