# Preact Email

A pnpm / TypeScript monorepo that vendors the **current combined `react-email` package's component source**, with a small Preact renderer. `react-email@6.11.3`, React and React DOM are development-only comparison dependencies. There is no dependency on the deprecated `@react-email/components` package.

- `packages/email`: 16 core components, synchronous and asynchronous HTML rendering, and plain text via a compile-once html-to-text converter. Runtime dependencies: Preact 10, preact-render-to-string, and html-to-text.
- `packages/email-markdown`: `@tallystone/preact-email-markdown`, with marked.
- `packages/email-code-block`: `@tallystone/preact-email-code-block`, with Prism.
- `packages/email-tailwind`: `@tallystone/preact-email-tailwind`, with Tailwind CSS and css-tree.
- `packages/email-preview`: `@tallystone/preact-email-preview`, an installable local preview server with recursive email discovery.
- `tools/parity`: shared template fixtures, upstream comparisons, and benchmarks.
- [`tools/parity/test-emails`](tools/parity/test-emails/README.md): eight standalone TSX emails with eighteen scenarios, nested reusable layouts, rich styling, and automatic React/Preact parity tests.
- `scripts/sync-components.ts`: reproducible, pinned component-only source sync. Neither upstream rendering nor CLI/dev-server source is copied.

TypeScript is 7.0.2 in the lockfile, with `strict` and `noUncheckedIndexedAccess` enabled. Preact 10 matches the renderer's peer range. `preact/compat` is retained for upstream `forwardRef` and component utilities; React aliases are not needed. The upstream-generated Prism grammar retains its upstream `@ts-nocheck` directive; project code and other vendored sources are checked.

## Development

Use Node 22.18+ (Node 24 LTS recommended) and pnpm 12.6.0:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm preview  # Start live previews at http://localhost:3000
pnpm bench
pnpm size
```

Development scripts use native Node type stripping, with explicit `.ts` imports. Tests build the packages first and exercise emitted JavaScript; esbuild compiles TSX fixture bundles and live previews. No `tsx` runtime loader is needed.

The original sketches under `scratch/` are preserved and excluded from compilation. `pnpm build` emits ESM and declarations in each package's `dist/`. These packages have not been published.

## Usage

Configure your application's TypeScript with `"jsx": "react-jsx"` and `"jsxImportSource": "preact"`. Templates must create Preact elements.

```tsx
import { Html, Head, Body, Text, Button, renderEmail } from '@tallystone/preact-email';

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
import { Text } from '@tallystone/preact-email/components';
import { render } from '@tallystone/preact-email/render';
const html = render(<Text>Hello</Text>);
```

`render(node)` returns an HTML string with the XHTML doctype. `renderAsync(node)` supports asynchronous/Suspense rendering, including Tailwind. `renderEmail(node)` returns `{ html, text }` synchronously, evaluating the template once. `toPlainText(html)` converts existing HTML synchronously.

The html-to-text converter compiles its options lazily on the first text conversion and reuses that function. It uses upstream's default formatting options, plus a title skip selector to account for Preact's lack of title hoisting. Plain text contains decoded characters, not HTML entities. The previous custom converters and method-selection API have been removed.

Optional components are independently installable packages:

```tsx
import { Markdown } from '@tallystone/preact-email-markdown';
import { CodeBlock, dracula } from '@tallystone/preact-email-code-block';
import { Tailwind } from '@tallystone/preact-email-tailwind';
import { renderAsync, toPlainText } from '@tallystone/preact-email';

const html = await renderAsync(<Tailwind>{email}</Tailwind>);
const text = toPlainText(html);
```

Install only the optional packages you use. Markdown, CodeBlock and Tailwind do not depend on one another, and the core does not install any of them.

## Previewing emails in your project

After publication, install the preview server as a development dependency:

```sh
pnpm add @tallystone/preact-email preact@^10.29.8
pnpm add -D @tallystone/preact-email-preview
pnpm exec preact-email-preview --dir ./emails
```

The default directory is `./emails`. Nested TSX emails appear in a folder tree, with one sidebar entry per email and a selector for its scenarios. Live updates are enabled by default. Bundles and rendered emails stay in memory. The server has only esbuild and htmlparser2 as direct runtime dependencies; it uses your installed core and Preact packages. No React Email CLI or React runtime is needed.

See [the preview package documentation](packages/email-preview/README.md) for template conventions, assets and CLI options.

## Compatibility and limits

The tests compare the current combined upstream package, not the deprecated component packages. Eight compact fixtures cover every core component, and separate tests cover all three optional components. Eight standalone TSX templates add eighteen richer scenarios: authored dark themes, image swaps with Outlook hooks, light-only opt-out controls; checkout confirmations with cart objects, calculated totals, discounts, digital delivery and special characters; full/compact invitations, multi-item and free-replacement receipts, editorial/32-story/empty digests, and access notices with optional raw HTML. Each TSX file is compiled independently for the actual React and Preact runtimes, including its shared nested components. Plain-text assertions are exact, including whitespace. Additional cases cover lists, preformatted content, entities, inline spacing, hidden previews, raw HTML, and links.

HTML comparison preserves text, attributes, style values and Outlook conditional comments. It normalizes attribute/style declaration order, equivalent entity/void syntax, zero CSS lengths (`0px` versus `0`), renderer transport comments, title hoisting, and meta positioning within the head. These are comparison rules, not transformations applied to output.

Text formatting is delegated to html-to-text 9.0.5, matching the pinned upstream dependency. The public wrapper uses fixed upstream defaults; custom selector/options configuration is not exposed. Use `toPlainText(await renderAsync(node))` for asynchronous templates. Pretty-printing and upstream's rendering option object are not implemented.

## Vendoring

The source is pinned to [resend/react-email commit e0561e1](https://github.com/resend/react-email/tree/e0561e164e9c28859d24373804e30b364931ee77), whose package version is 6.11.3. Parity is independently verified against the published 6.11.3 release. Each component package includes upstream's MIT license and a manifest containing original source SHA-256 hashes and the applied adaptation categories.

```sh
git clone https://github.com/resend/react-email.git /tmp/react-email-upstream
git -C /tmp/react-email-upstream checkout e0561e164e9c28859d24373804e30b364931ee77
pnpm sync:components /tmp/react-email-upstream
pnpm check
```

The script requires the pinned commit and a clean component source tree. It copies only component implementation files and their local utilities, excluding tests/e2e fixtures. Edit the sync script for adaptations, not generated files. When upgrading, update the pinned commit and dev comparison version together, review the manifest and generated changes, and rerun tests and benchmarks. Components carry upstream's implementation; the renderer is local and text formatting uses html-to-text.

## Measurements

Machine-readable results are in `benchmarks/latest.json` and `benchmarks/size.json`. Benchmark runs also save `benchmarks/latest-all.json`, `benchmarks/latest-compact.json`, or `benchmarks/latest-tsx.json` according to the selected corpus. `pnpm bench` now includes both the compact fixtures and all standalone TSX scenarios by default. To measure the richer emails alone:

```sh
BENCH_CORPUS=tsx BENCH_ITERATIONS=1000 BENCH_SAMPLES=5 pnpm bench
```

Use `BENCH_CORPUS=compact` for the original small fixtures or `all` for both. TSX compilation is outside the timed section; each operation constructs its template with the matching runtime. All methods must match upstream output before timing begins.

Measurements use 50 warmup operations per method and report median warm throughput. Rendering includes template construction; text-only measurements reuse HTML. These are not cold-start or concurrency measurements.

Benchmarks compare React and Preact HTML, HTML plus upstream's per-call converter, and HTML plus the production compile-once converter. Both paths skip titles to account for Preact's lack of title hoisting. Compilation happens before timing and every fixture must pass exact text parity checks.

The size report measures minified production Node bundles with runtime dependencies included, not npm install sizes. The size check excludes React, React DOM and react-email from the core bundle, and ensures the HTML-only entry points exclude html-to-text. Rerun measurements on your workload.
