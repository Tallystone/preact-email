# Preact Email

A pnpm / TypeScript monorepo that vendors the **current combined `react-email` package's component source**, with a small Preact renderer. `react-email@6.11.3`, React and React DOM are development-only comparison dependencies. There is no dependency on the deprecated `@react-email/components` package.

- `packages/email`: 16 core components, synchronous and asynchronous HTML rendering, and three plain-text implementations. Runtime dependencies: Preact 10, preact-render-to-string, htmlparser2, and entities.
- `packages/email-extras`: optional Markdown, CodeBlock, and Tailwind components with their own dependencies. Installing the core does not install these extras.
- `tools/parity`: shared template fixtures, upstream comparisons, and benchmarks.
- [`tools/parity/test-emails`](tools/parity/test-emails/README.md): four standalone TSX emails with nine scenarios, nested reusable layouts, rich styling, and automatic React/Preact parity tests.
- `scripts/sync-components.ts`: reproducible, pinned component-only source sync. Neither upstream rendering nor CLI/dev-server source is copied.

TypeScript is 7.0.2 in the lockfile, with `strict` and `noUncheckedIndexedAccess` enabled. Preact 10 matches the renderer's peer range. `preact/compat` is retained for upstream `forwardRef` and component utilities; React aliases are not needed. The upstream-generated Prism grammar retains its upstream `@ts-nocheck` directive; project code and other vendored sources are checked.

## Development

Use Node 22+ and pnpm 12.6.0:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm preview  # React Email UI at http://localhost:3000
pnpm bench
pnpm size
```

The original sketches under `scratch/` are preserved and excluded from compilation. `pnpm build` emits ESM and declarations in each package's `dist/`. These packages have not been published.

## Usage

Configure your application's TypeScript with `"jsx": "react-jsx"` and `"jsxImportSource": "preact"`. Templates must create Preact elements.

```tsx
import { Html, Head, Body, Text, Button, renderEmail } from '@hillac/preact-email';

const email = (
  <Html>
    <Head />
    <Body>
      <Text>Hello Jane, your documents are ready.</Text>
      <Button href="https://example.com/work/42">View documents</Button>
    </Body>
  </Html>
);
const { html, text } = renderEmail(email);
```

For HTML alone, these entry points avoid loading text conversion:

```tsx
import { Text } from '@hillac/preact-email/components';
import { render } from '@hillac/preact-email/render';
const html = render(<Text>Hello</Text>);
```

`render(node)` returns an HTML string with the XHTML doctype. `renderAsync(node)` supports asynchronous/Suspense rendering, including Tailwind. `renderEmail(node, { textMethod })` returns `{ html, text }` synchronously; `textMethod` is `parser` (default), `regex`, or `tree`. `toPlainText(html, 'parser' | 'regex')` converts existing HTML. `textFromTree(node)` extracts text before HTML serialization.

The parser uses htmlparser2. The regex method uses a separate tokenizer, and the tree method evaluates components into text nodes. All three share the formatting rules. Tree extraction avoids serializing the whole email, but parses any `dangerouslySetInnerHTML` fragment. `renderEmail` with `tree` evaluates templates twice, so they must be pure.

Optional components live in separate entry points:

```tsx
import { Markdown } from '@hillac/preact-email-extras/markdown';
import { CodeBlock, dracula } from '@hillac/preact-email-extras/code-block';
import { Tailwind } from '@hillac/preact-email-extras/tailwind';
import { renderAsync, toPlainText } from '@hillac/preact-email';

const html = await renderAsync(<Tailwind>{email}</Tailwind>);
const text = toPlainText(html);
```

The extras package installs marked, prismjs, css-tree and tailwindcss. Its separate entry points prevent importing unrelated optional component modules, but all extras dependencies are installed if you install that package.

## Compatibility and limits

The tests compare the current combined upstream package, not the deprecated component packages. Eight compact fixtures cover every core component, and separate tests cover all three optional components. Four standalone TSX templates add nine richer scenarios: full/compact invitations, multi-item and free-replacement receipts, editorial/32-story/empty digests, and access notices with optional raw HTML. Each TSX file is compiled independently for the actual React and Preact runtimes, including its shared nested components. Plain-text assertions are exact, including whitespace. Additional cases cover lists, preformatted content, entities, inline spacing, hidden previews, raw HTML, and links.

HTML comparison preserves text, attributes, style values and Outlook conditional comments. It normalizes attribute/style declaration order, equivalent entity/void syntax, zero CSS lengths (`0px` versus `0`), renderer transport comments, title hoisting, and meta positioning within the head. These are comparison rules, not transformations applied to output.

The text converters are a lightweight subset of upstream's html-to-text behavior, **not universal drop-in replacements**. Custom selectors/options, data-table alignment (`data-text-format="dataTable"`), complex nested lists, and arbitrary malformed HTML are not covered. Extend parity fixtures before relying on those features. The regex tokenizer does not implement HTML error recovery or the full raw-text grammar. The tree path supports pure synchronous function components and fragments; hooks, context, class components, async components and Suspense are unsupported. Use parser text after `renderAsync` for Tailwind or async templates. Pretty-printing and upstream's rendering option object are not implemented.

## Vendoring

The source is pinned to [resend/react-email commit e0561e1](https://github.com/resend/react-email/tree/e0561e164e9c28859d24373804e30b364931ee77), whose package version is 6.11.3. Parity is independently verified against the published 6.11.3 release. Each package includes upstream's MIT license and a manifest containing original source SHA-256 hashes and the applied adaptation categories.

```sh
git clone https://github.com/resend/react-email.git /tmp/react-email-upstream
git -C /tmp/react-email-upstream checkout e0561e164e9c28859d24373804e30b364931ee77
pnpm sync:components /tmp/react-email-upstream
pnpm check
```

The script requires the pinned commit and a clean component source tree. It copies only component implementation files and their local utilities, excluding tests/e2e fixtures. Edit the sync script for adaptations, not generated files. When upgrading, update the pinned commit and dev comparison version together, review the manifest and generated changes, and rerun tests and benchmarks. Components carry upstream's implementation; the renderer and text conversion are local.

## Measurements

Machine-readable results are in `benchmarks/latest.json` and `benchmarks/size.json`. The initial run used Node 24.18.0, eight rotating fixtures, 50 warmup operations per method, and five samples of 200 operations. Rendering measurements include template construction; HTML-plus-text produces both outputs after one HTML render for upstream. Text-only measurements reuse HTML, except tree extraction, which includes template construction. Results are warm throughput, not cold-start or concurrency measurements; no speed thresholds are enforced in tests.

| Method | Emails/second, initial run |
| --- | ---: |
| Upstream HTML | 3,779 |
| Preact HTML | 14,237 |
| Upstream HTML + text | 954 |
| Preact HTML + parser | 5,507 |
| Preact HTML + regex | 5,457 |
| Preact HTML + tree | 6,817 |

The benchmark also includes `preact HTML + upstream html-to-text` to isolate renderer cost while retaining upstream text conversion. Both renderer paths use identical upstream options with an additional `title` skip selector: React hoists Preview's title into the head, whereas Preact leaves it in the body. Parity checks verify that this adjustment preserves upstream text output on every fixture. These timings use upstream's per-call conversion API, not a cached `html-to-text.compile()` converter. Both html-to-text and our parser path use htmlparser2; the custom path's speedup measures the smaller conversion pipeline, not parser speed in isolation.

The initial representative bundled `Text` email was about **14 KB gzip** for Preact HTML, **40 KB gzip** with text conversion, and **205 KB gzip** for upstream. These are minified production Node bundles with runtime dependencies included, not npm install sizes. The size check also asserts that React, React DOM, react-email and html-to-text do not enter the core bundle. Results depend on the machine and template; rerun on your own workload. Parser remains the default because it has better HTML handling than regex and broader component compatibility than tree extraction.
