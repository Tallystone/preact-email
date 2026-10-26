import { Parser } from 'htmlparser2';
// Compare parsed markup, retaining text, conditional comments, styles and attributes.
// Ignore renderer transport comments, attribute order, void syntax and
// title/meta hoisting. HTML parsing also decodes entities and folds name casing.
// Inline styles only normalize known zero lengths and one trailing semicolon; preserve
// declaration order, duplicates and whitespace. Text and <style> CSS stay exact.
export function normalizeHtml(html: string): unknown {
  type Node = { tag: string; attrs: Record<string, string>; children: (Node | string | { comment: string } | { instruction: string })[] };
  const root: Node = { tag: '', attrs: {}, children: [] };
  const stack = [root];
  const titles: Node[] = [];
  const parser = new Parser({
    onopentag(tag, attrs) {
      if (attrs.style) {
        // Be conservative around CSS strings, functions, escapes and comments.
        // Only these complete declarations differ in the current renderer corpus.
        if (!/["'()\\/]/.test(attrs.style)) {
          attrs.style = attrs.style.replace(
            /(^|;)((?:margin(?:-top|-right|-bottom|-left)?|padding|max-height|max-width):)0px(?=;|$)/g,
            (_match, separator: string, property: string) => `${separator}${property}0`,
          );
        }
        attrs.style = attrs.style.replace(/;$/, '');
      }
      const node: Node = { tag, attrs, children: [] };
      if (tag === 'title') titles.push(node); else stack.at(-1)!.children.push(node);
      stack.push(node);
    },
    onclosetag() {
      const node = stack.pop();
      if (node?.tag === 'head') node.children.sort((a, b) => Number(typeof b !== 'string' && 'tag' in b && b.tag === 'meta') - Number(typeof a !== 'string' && 'tag' in a && a.tag === 'meta'));
    },
    ontext(text) {
      const children = stack.at(-1)!.children;
      if (typeof children.at(-1) === 'string') children[children.length - 1] += text;
      else children.push(text);
    },
    oncomment(text) {
      if (/^(\/?\$s?| |html|head|body)$/.test(text)) return;
      stack.at(-1)!.children.push({ comment: text });
    },
    onprocessinginstruction(_name, instruction) {
      stack.at(-1)!.children.push({ instruction });
    },
  });
  parser.end(html);
  return { root, titles };
}
