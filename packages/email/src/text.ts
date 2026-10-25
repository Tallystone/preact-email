import { Parser } from 'htmlparser2';
import { decodeHTML } from 'entities';
import {
  Fragment,
  isValidElement,
  type ComponentChildren,
  type VNode,
} from 'preact';

interface Element {
  tag: string;
  attrs: Record<string, string>;
  children: TextNode[];
}
type TextNode = string | Element;
const voids = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const skipped = new Set([
  'head',
  'title',
  'img',
  'script',
  'style',
  'template',
  'noscript',
]);
const blocks = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'blockquote',
  'address',
  'pre',
  'table',
  'ul',
  'ol',
  'dl',
]);
export type TextMethod = 'parser' | 'regex' | 'tree';

function builder() {
  const root: Element = { tag: '', attrs: {}, children: [] };
  const stack = [root];
  return {
    root,
    open(tag: string, attrs: Record<string, string>) {
      const element = { tag, attrs, children: [] };
      stack.at(-1)!.children.push(element);
      if (!voids.has(tag)) stack.push(element);
    },
    close(tag: string) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i]!.tag === tag) {
          stack.length = i;
          break;
        }
      }
    },
    text(value: string) {
      stack.at(-1)!.children.push(value);
    },
  };
}
function parse(html: string): Element {
  const b = builder();
  const parser = new Parser(
    { onopentag: b.open, onclosetag: b.close, ontext: b.text },
    { decodeEntities: true },
  );
  parser.end(html);
  return b.root;
}
// Experimental tokenizer: intentionally separate from the HTML parser. Quoted > is supported;
// HTML error recovery, raw-text elements and malformed markup are not a full HTML grammar.
function regexParse(html: string): Element {
  const b = builder();
  for (const match of html.matchAll(
    /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|[^<]+|</g,
  )) {
    const token = match[0];
    if (token.startsWith('<!')) continue;
    const tag = /^<\/?([\w:-]+)/.exec(token)?.[1]?.toLowerCase();
    if (!tag) {
      b.text(decodeHTML(token));
      continue;
    }
    if (token.startsWith('</')) {
      b.close(tag);
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const attribute of token
      .slice(tag.length + 1, -1)
      .matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attribute[1]!.toLowerCase()] = decodeHTML(
        attribute[2] ?? attribute[3] ?? attribute[4] ?? '',
      );
    }
    b.open(tag, attrs);
    if (token.endsWith('/>')) b.close(tag);
  }
  return b.root;
}
function format(root: Element): string {
  const protectedText: string[] = [];
  let marker = '\u0000';
  const source = JSON.stringify(root);
  while (source.includes(JSON.stringify(marker).slice(1, -1)))
    marker += '\u0000';
  function protect(value: string): string {
    protectedText.push(value);
    return `${marker}${protectedText.length - 1}${marker}`;
  }
  function boundary(lines: number): string {
    return `${marker}b${lines}${marker}`;
  }
  function clean(value: string): string {
    // Adjacent block boundaries merge by maximum, rather than adding their
    // whitespace. Headings h1-h3 request three newlines; paragraphs request two.
    const boundaries = new RegExp(
      `(?:[ \t\n]*${marker}b[123]${marker})+[ \t\n]*`,
      'g',
    );
    return value
      .replace(boundaries, (run) => {
        const requested = [
          ...run.matchAll(new RegExp(`${marker}b([123])${marker}`, 'g')),
        ].map((match) => Number(match[1]));
        const literalLines =
          run
            .replace(new RegExp(`${marker}b[123]${marker}`, 'g'), '')
            .split('\n').length - 1;
        return '\n'.repeat(Math.max(literalLines, ...requested));
      })
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/^[ \n]+|[ \n]+$/g, '');
  }

  function visit(node: TextNode, pre = false): string {
    if (typeof node === 'string')
      return pre ? node : node.replace(/[ \t\r\n\f\u200b]+/g, ' ');
    const { tag, attrs, children } = node;
    if (skipped.has(tag) || attrs['data-skip-in-text'] === 'true') return '';
    let content = children
      .map((child) => visit(child, pre || tag === 'pre'))
      .join('');
    if (tag === 'pre') return `${boundary(2)}${protect(content)}${boundary(2)}`;
    if (tag === 'ul' || tag === 'ol') {
      let number = Number.parseInt(attrs.start ?? '1', 10);
      if (!Number.isFinite(number)) number = 1;
      const items = children.filter(
        (child): child is Element =>
          typeof child !== 'string' && child.tag === 'li',
      );
      const lines = items.map((child) => {
        const prefix = tag === 'ol' ? ` ${number++}. ` : ' * ';
        return (
          prefix +
          clean(child.children.map((c) => visit(c)).join('')).replaceAll(
            '\n',
            '\n' + ' '.repeat(prefix.length),
          )
        );
      });
      return `${boundary(2)}${protect(lines.join('\n'))}${boundary(2)}`;
    }
    if (tag === 'a') {
      const href = attrs.href?.replace(/^mailto:/i, '');
      if (href && !href.startsWith('#') && href !== content.trim())
        content += ` ${href}`;
    }
    if (/^h[1-6]$/.test(tag))
      return `${boundary(/^h[1-3]$/.test(tag) ? 3 : 2)}${content.toUpperCase()}${boundary(2)}`;
    if (tag === 'br') return '\n';
    if (tag === 'hr') return boundary(2) + '-'.repeat(40) + boundary(2);
    if (tag === 'li') return `\n * ${content.trim()}\n`;
    if (tag === 'tr') return content;
    if (tag === 'td' || tag === 'th') return content;
    if (blocks.has(tag)) {
      const lines = [
        'div',
        'section',
        'article',
        'header',
        'footer',
        'main',
      ].includes(tag)
        ? 1
        : 2;
      return `${boundary(lines)}${content}${boundary(lines)}`;
    }
    return content;
  }
  // Like html-to-text, prefer body when a full document is supplied.
  function body(node: Element): Element | undefined {
    if (node.tag === 'body') return node;
    for (const child of node.children)
      if (typeof child !== 'string') {
        const found = body(child);
        if (found) return found;
      }
    return undefined;
  }
  let result = clean(visit(body(root) ?? root));
  for (let i = protectedText.length - 1; i >= 0; i--)
    result = result.replaceAll(`${marker}${i}${marker}`, protectedText[i]!);
  return result;
}
export function toPlainText(
  html: string,
  method: 'parser' | 'regex' = 'parser',
): string {
  return format(method === 'regex' ? regexParse(html) : parse(html));
}

/** Experimental: evaluates synchronous, pure function components without serializing HTML.
 * Hooks, context, class components, Suspense and async components are unsupported.
 */
export function textFromTree(node: ComponentChildren): string {
  function visit(value: ComponentChildren): TextNode[] {
    if (value == null || typeof value === 'boolean') return [];
    if (Array.isArray(value)) return value.flatMap(visit);
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint'
    )
      return [String(value)];
    if (!isValidElement(value))
      throw new TypeError('Unsupported child in text tree');
    const vnode = value as VNode<Record<string, unknown>>;
    const props = vnode.props;
    if (vnode.type === Fragment)
      return visit(props.children as ComponentChildren);
    if (typeof vnode.type === 'function') {
      if (vnode.type.prototype?.render)
        throw new TypeError('Tree text does not support class components');
      const result = (
        vnode.type as (props: Record<string, unknown>) => ComponentChildren
      )(props);
      if (result && typeof result === 'object' && 'then' in result)
        throw new TypeError('Tree text does not support async components');
      return visit(result);
    }
    const attrs: Record<string, string> = {};
    for (const [key, val] of Object.entries(props))
      if (
        typeof val === 'string' ||
        typeof val === 'boolean' ||
        typeof val === 'number'
      )
        attrs[key.toLowerCase()] = String(val);
    if (skipped.has(vnode.type) || attrs['data-skip-in-text'] === 'true')
      return [];
    const raw = props.dangerouslySetInnerHTML as
      { __html?: string } | undefined;
    return [
      {
        tag: vnode.type,
        attrs,
        children: raw?.__html
          ? parse(raw.__html).children
          : visit(props.children as ComponentChildren),
      },
    ];
  }
  return format({ tag: '', attrs: {}, children: visit(node) });
}
