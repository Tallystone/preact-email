# Standalone TSX test emails

These fictional Fern Post emails use original copy and reusable components. Each file exports a default template and a `scenarios` array with deterministic props. They import `@hillac/preact-email` and use Preact JSX normally.

| Template | Scenarios | Coverage |
| --- | --- | --- |
| `trail-invitation.tsx` | Full invitation; compact Unicode variant | Nested shell/content layout, optional note and postscript, CTA, expiry, desktop hint, ordered list, help section, fallback URL |
| `parcel-receipt.tsx` | Dispatched multi-item order; pending free replacement | Mapped child components, images, table columns, totals, zero values, conditional CTA and packing note |
| `community-digest.tsx` | Editorial; 32-story edition; empty edition | Repeated nested cards, alternating styles, missing recipient, empty collections, skipped decorative content, list and inline code |
| `access-notice.tsx` | Unrecognised visit; confirmed visit | Status branches, preformatted whitespace, raw HTML, entities, non-breaking spaces, links, recovery code |

`components/layout.tsx` contains the shared `EmailShell`, `ActionPanel`, and `Facts` components. The shell includes a preview, font, embedded responsive CSS, logo, styled card and footer. The content panel accepts JSX slots and conditionally renders the message, action, supporting text and help section.

Open the React Email preview server from the repository root:

```sh
pnpm preview
# Or choose another port:
pnpm preview --port 3001
```

Visit http://localhost:3000 and select a template. Each default component has `PreviewProps` set to its first scenario; change the index at the bottom of the TSX file to view another variant. Edits to the template and shared layout reload in the preview.

The dev-only `scripts/react-email-preview.ts` plugin maps our components to upstream `react-email` and uses React-compatible JSX for the preview server. This shows the upstream reference rendering; the parity tests verify that our Preact output matches it. The runtime package is unchanged. React Email may download its preview UI on first launch. Image URLs in these fixtures are placeholders on example.com, so those images will not load until replaced with real assets.

Run the validation suite from the repository root:

```sh
pnpm check
```

`tools/parity/src/tsx-emails.test.ts` discovers every top-level `.tsx` file here and compiles each twice with esbuild:

1. React's real JSX runtime and the published `react-email` components.
2. Preact's real JSX runtime and this repository's components.

Shared components are compiled along with each template. No React-to-Preact VNode conversion is used. Temporary bundles are cleaned up after the test.

Every scenario checks synchronous and asynchronous HTML against upstream, plus exact plain text for parser, regex, tree extraction, and upstream html-to-text on Preact HTML. The reference comes from upstream `render(node, { plainText: true })`, cross-checked against upstream `toPlainText(html)`. Required/absent text assertions ensure meaningful content and conditional branches are actually exercised.

HTML uses the existing narrow normalization of renderer serialization differences (attribute order, equivalent zero lengths, transport comments and metadata placement). It preserves content, styling and Outlook conditional markup. **Plain text is compared byte-for-byte with no normalization.** The upstream html-to-text baseline skips titles to account for Preact's lack of title hoisting, as documented in the root README.

Add a default component and at least two scenarios to a new `.tsx` file to include it automatically. Scenario objects contain `name`, `props`, `contains` and `excludes`. The last two arrays describe expected plain text, so use uppercase for text appearing in headings.

The existing small fixtures in `src/fixtures.ts` remain the benchmark corpus; these richer TSX emails are additional correctness tests. Historical benchmark results do not measure these templates.
