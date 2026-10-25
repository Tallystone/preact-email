# Standalone TSX test emails

These fictional Fern Post emails use original copy and reusable components. Each file exports a default template and a `scenarios` array with deterministic props. They import `@hillac/preact-email` and use Preact JSX normally.

| Template | Scenarios | Coverage |
| --- | --- | --- |
| `dark-mode-authored.tsx` | Invitation; reservation | Color-scheme opt-in, authored media queries, dark surfaces/text/links/buttons, responsive padding |
| `dark-mode-image-swap.tsx` | Apple CSS only; Apple + Outlook hooks | Light/dark PNG logos, hidden fallback image, `[data-ogsc]` overrides, linked images |
| `dark-mode-light-only.tsx` | Light-only opt-out; no-opt-out control | Same content with and without Gmail's current Google-account opt-out |
| `trail-invitation.tsx` | Full invitation; compact Unicode variant | Nested shell/content layout, optional note and postscript, CTA, expiry, desktop hint, ordered list, help section, fallback URL |
| `checkout-complete.tsx` | Mixed physical cart; digital cart with special characters; fully discounted cart | Object-array props, mapped item components, quantities, computed totals, tax, shipping, discount and delivery branches |
| `parcel-receipt.tsx` | Dispatched multi-item order; pending free replacement | Mapped child components, images, table columns, totals, zero values, conditional CTA and packing note |
| `community-digest.tsx` | Editorial; 32-story edition; empty edition | Repeated nested cards, alternating styles, missing recipient, empty collections, skipped decorative content, list and inline code |
| `access-notice.tsx` | Unrecognised visit; confirmed visit | Status branches, preformatted whitespace, raw HTML, entities, non-breaking spaces, links, recovery code |

`components/layout.tsx` contains the shared `EmailShell`, `ActionPanel`, and `Facts` components. The shell includes a preview, font, embedded responsive CSS, logo, styled card and footer. The content panel accepts JSX slots and conditionally renders the message, action, supporting text and help section.

Start the local live preview from the repository root:

```sh
pnpm preview
```

Open http://localhost:3000 (set `PORT` to change it). The server binds only to localhost by default. Use `pnpm preview --host` to listen on network interfaces, or `pnpm preview --host 192.168.1.10` to bind a specific interface. Network access is opt-in; `--host` is a bind setting, not a firewall. Each email appears once in the sidebar. Click its row, then choose a scenario from the selector to the right of the subject and preview text. The selector is hidden for emails with one preview. The toolbar includes viewport presets, custom width/height, an email Dark mode toggle with a Dark-mode approximation selector (visible only when enabled), Open, Text, and Live controls. The selected email and tool settings are stored in the URL and support browser back/forward. Client profiles cover Apple Mail (macOS/iOS), Gmail (desktop/mobile web, Android/iOS with Google or other/legacy accounts), and Outlook (classic/new Windows, web, macOS, iOS and Android).

The server bundles and renders templates in memory without writing generated HTML, text, or bundles to disk. Saving templates, shared components, core source, or the preview UI reloads the page while preserving URL state. Errors appear above the last successful preview. Live updates are on by default; turn Live off to pause browser updates. Stop the server with Ctrl+C.

Templates can expose a subject function using the same props as the email:

```tsx
CheckoutComplete.Subject = ({ orderId }: CheckoutCompleteProps) =>
  `Order ${orderId} — checkout complete`;
```

The viewer shows that subject and the first rendered `Preview` component's text above the email. A dev-only marker identifies the actual component, including when nested in layouts or using `useTitleTag={false}`. Extraction ignores the invisible padding and decodes HTML entities. Templates render once; published component markup is unchanged. Missing subject or preview rows are hidden.

Image URLs are placeholders on example.com, so those images will not load until replaced with real assets. The server renders each entry in `scenarios`, or uses the default component’s `PreviewProps` when no scenarios are supplied. Existing scenario URLs and back/forward navigation still work.

Run the validation suite from the repository root:

```sh
pnpm check
```

`tools/parity/src/tsx-emails.test.ts` discovers every top-level `.tsx` file here and compiles each twice with esbuild:

1. React's real JSX runtime and the published `react-email` components.
2. Preact's real JSX runtime and this repository's components.

Shared components are compiled along with each template. No React-to-Preact VNode conversion is used. Temporary bundles are cleaned up after the test.

Every scenario checks synchronous and asynchronous HTML against upstream, plus exact plain text for the compiled html-to-text converter and upstream html-to-text on Preact HTML. The reference comes from upstream `render(node, { plainText: true })`, cross-checked against upstream `toPlainText(html)`. Required/absent text assertions ensure meaningful content and conditional branches are actually exercised.

HTML uses the existing narrow normalization of renderer serialization differences (attribute order, equivalent zero lengths, transport comments and metadata placement). It preserves content, styling and Outlook conditional markup. **Plain text is compared byte-for-byte with no normalization.** The upstream html-to-text baseline skips titles to account for Preact's lack of title hoisting, as documented in the root README.

Add a default component and at least two scenarios to a new `.tsx` file to include it automatically. Scenario objects contain `name`, `props`, `contains` and `excludes`. The last two arrays describe expected plain text, so use uppercase for text appearing in headings.

The benchmark includes these scenarios by default alongside the small fixtures. Run `BENCH_CORPUS=tsx BENCH_ITERATIONS=1000 BENCH_SAMPLES=5 pnpm bench` to measure only these richer emails. The React and Preact templates are compiled before timing. Historical runs recorded before TSX corpus support only measured the small fixtures; inspect the result file’s `fixtures` and `selection` fields.

### Dark appearance profiles

Equivalent implementations are grouped into seven choices: authored CSS (Apple Mail / Outlook macOS), unchanged Gmail web, Gmail Android with and without the Google-account opt-out, Gmail iOS with the opt-out, full adjustment without the opt-out (Gmail iOS other/legacy / Outlook classic), and selective adjustment with Outlook hooks (new Windows / web / mobile). Existing client URLs still resolve to the matching group.

These are local browser previews, not actual email-client engines or exhaustive historical version emulators. The selected profile and dark toggle are saved in the URL. The surrounding UI follows the system theme independently. The selector only models dark-mode appearance, not general email-client rendering. Open opens the original email; transformations apply only inside the preview frame.

- Apple Mail and the Outlook macOS authored-CSS profile activate the email's own dark media queries when it declares dark color-scheme support. Light mode forces light queries regardless of your operating system. Responsive conditions remain active.
- Gmail web profiles keep the message light while the preview UI darkens.
- Gmail Android and modern Outlook profiles approximate selective recoloring; Gmail iOS and classic Outlook approximate full color adjustment. These use a local hue-preserving color heuristic, not the clients' proprietary algorithms.
- Current Gmail Google-account profiles honor `<meta name="color-scheme" content="light only">`. Other-account/legacy profiles omit that opt-out.
- Images, SVG content, gradients, background images and pseudo-elements are not recolored. Outlook profiles expose `data-ogsc` / `data-ogsb` hooks, but don't reproduce its sanitizer, Word renderer, all CSS support differences or contrast algorithms. Cross-origin stylesheets cannot be inspected.

Reference behavior: [Email Markup Consortium's Gmail update](https://emailmarkup.org/en/blog/2026/gmail-app-dark-mode-update), [Can I Email CSS support tests](https://www.caniemail.com/features/css-at-media-prefers-color-scheme/), and [Apple Mail opt-in investigation](https://github.com/hteumeuleu/email-bugs/issues/104). Actual client checks are still needed for final appearance.

### Trying the dark-mode fixtures

- **dark-mode-authored**: choose Apple Mail / Outlook macOS and toggle dark mode. Backgrounds, text, links and the button switch to a deliberately designed palette. Narrow the viewport to see responsive padding work alongside dark CSS.
- **dark-mode-image-swap**: choose Apple Mail to swap the linked logo. Choose the grouped modern Outlook option to compare the CSS-only scenario with the scenario containing Outlook hooks.
- **dark-mode-light-only**: choose Gmail iOS or Android with a Google account. The opt-out stays light; its control is automatically recolored. This is an opt-out demonstration, not an authored dark theme. Other/legacy account profiles do not honor it.

The two small PNGs in `assets/` are served locally by the preview server. The fixture image URLs are relative for local testing; replace them with absolute public HTTPS URLs before sending a real email. All scenarios also check normalized HTML and exact plain-text parity with upstream; dark fixtures additionally assert that their meta tags, selectors, and image markup survive rendering.

Techniques follow [Litmus's authored CSS, image-swap and Outlook-hook examples](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers) and the [Email Markup Consortium's Gmail light-only update](https://emailmarkup.org/en/blog/2026/gmail-app-dark-mode-update). Support varies by client; these fixtures exercise our approximation, not a live inbox rendering engine.
