import { Parser } from 'htmlparser2';
// Compare parsed markup, retaining text, conditional comments, styles and attributes.
// Only renderer transport comments, doctype, attribute order, void syntax and title
// hoisting are ignored. No wholesale whitespace normalization of email content.
export function normalizeHtml(html: string): unknown {
  type Node = { tag: string; attrs: Record<string, string>; children: (Node | string)[] };
  const root: Node = { tag: '', attrs: {}, children: [] };
  const stack = [root];
  const titles: Node[] = [];
  const parser = new Parser({
    onopentag(tag, attrs) {
      if (attrs.style) attrs.style = attrs.style.replace(/(?<=[:\s])0px(?=[;\s]|$)/g, '0').split(';').filter(Boolean).sort().join(';');
      const node: Node = { tag, attrs: Object.fromEntries(Object.entries(attrs).sort()), children: [] };
      if (tag === 'title') titles.push(node); else stack.at(-1)!.children.push(node);
      stack.push(node);
    },
    onclosetag() {
      const node = stack.pop();
      if (node?.tag === 'head') node.children.sort((a, b) => Number(typeof b !== 'string' && b.tag === 'meta') - Number(typeof a !== 'string' && a.tag === 'meta'));
    },
    ontext(text) {
      const children = stack.at(-1)!.children;
      if (typeof children.at(-1) === 'string') children[children.length - 1] += text;
      else children.push(text);
    },
    oncomment(text) {
      if (/^(\/?\$[!?s]?| |html|head|body)$/.test(text)) return;
      stack.at(-1)!.children.push(`<!--${text}-->`);
    },
  });
  parser.end(html);
  return { root, titles };
}
