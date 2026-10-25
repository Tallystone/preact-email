# Preact Email

React Email components, vendored with minimal dependencies and a Preact renderer. Sync or async rendering, HTML and plain text, and an optional lightweight preview server.

<!-- benchmark-summary:start -->
**2.0× faster HTML rendering; 2.6× faster HTML + plain text** than React Email in the latest benchmark below.
<!-- benchmark-summary:end -->

## Usage

```sh
pnpm add @tallystone/preact-email preact
```

Set `"jsx": "react-jsx"` and `"jsxImportSource": "preact"` in your tsconfig.

```tsx
import { Html, Body, Text, renderEmail, renderAsync, toPlainText } from '@tallystone/preact-email';

const email = <Html><Body><Text>Hello Robin!</Text></Body></Html>;

const { html, text } = renderEmail(email); // synchronous
const asyncHtml = await renderAsync(email); // supports Suspense and Tailwind
const asyncText = toPlainText(asyncHtml);
```

Use `render(email)` for synchronous HTML only. Plain text uses a lazily compiled html-to-text converter.

Optional packages install separately:

| Package | Use |
| --- | --- |
| [preact-email-markdown](packages/email-markdown/README.md) | Markdown |
| [preact-email-code-block](packages/email-code-block/README.md) | Syntax highlighting |
| [preact-email-tailwind](packages/email-tailwind/README.md) | Tailwind CSS |
| [preact-email-registry](packages/email-registry/README.md) | Typed render registry and optional Zod validation |
| [preact-email-preview](packages/email-preview/README.md) | Local previews with live reload |

All packages use the `@tallystone` scope.

## Preview

```sh
pnpm add -D @tallystone/preact-email-preview
pnpm exec preact-email-preview --dir ./emails
```

Open http://localhost:3000. Finds TSX emails recursively; shows folders, scenarios, responsive previews and dark-mode approximations. Requires Node 22.18+.

## Benchmarks

<!-- benchmarks:start -->
| Renderer | Emails/sec | Seconds/email |
| --- | ---: | ---: |
| React Email — HTML | 2,463 | 0.000406 |
| Preact Email — HTML | 4,924 | 0.000203 |
| React Email — HTML + text | 776 | 0.001289 |
| Preact Email — HTML + text | 2,002 | 0.000499 |

2026-10-25 · Node v24.22.1 · 16 logical cores · production mode.
26 fixtures (all); median of 5 × 1,000 renders after warmup. Compilation excluded; HTML and text parity checked before timing. Results vary by workload.
<!-- benchmarks:end -->

Run `pnpm bench` to update these results and [the JSON report](benchmarks/latest.json). Set `BENCH_CORPUS=tsx` or `compact` to choose a subset; default is `all`.

## Development

```sh
pnpm install
pnpm check
pnpm preview
```

The **Update vendored React Email** GitHub workflow opens a tested update PR from an upstream version and commit. Push `vX.Y.Z` to publish all packages at that version with npm provenance. Configure npm trusted publishing for `Tallystone/preact-email`, workflow `publish.yml`, environment `npm`.
