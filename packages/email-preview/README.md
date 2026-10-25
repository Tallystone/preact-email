# @tallystone/preact-email-preview

A local preview server for Preact emails. Finds TSX templates recursively, shows their folders in the sidebar, and reloads on save. Bundles and rendered emails stay in memory.

Requires Node 22.18 or newer. Install in your email project:

```sh
pnpm add @tallystone/preact-email preact@^10.29.8
pnpm add -D @tallystone/preact-email-preview
pnpm exec preact-email-preview
```

The CLI defaults to `./emails` and http://localhost:3000. Add `"email:dev": "preact-email-preview"` to your package scripts if desired.

```text
emails/
  auth/
    welcome.tsx
  orders/
    receipt.tsx
  components/
    layout.tsx
  static/
    logo.png
```

Only `.tsx` files with a default component become emails. Helper directories named `components`, `static`, `assets`, `node_modules`, `build`, `dist`, `__tests__`, and `__snapshots__` are excluded. Names starting with `.` or `_`, and `.test.tsx`, `.spec.tsx`, `.stories.tsx` files are skipped. Imported helpers still work normally.

```tsx
import { Body, Html, Preview, Text } from '@tallystone/preact-email';

type Props = { name: string };
export default function Welcome({ name }: Props) {
  return (
    <Html><Body>
      <Preview>Your account is ready.</Preview>
      <Text>Welcome, {name}!</Text>
    </Body></Html>
  );
}
Welcome.PreviewProps = { name: 'Robin' } satisfies Props;
Welcome.Subject = ({ name }: Props) => `Welcome, ${name}`;
```

The viewer labels Subject and Preview above the email. Subject can return a string or a promise of a string. The first rendered `Preview` supplies preview text, including when nested in a layout. Without `PreviewProps`, the template receives `{}`.

For multiple examples, export a `scenarios` array. It takes precedence over `PreviewProps`; each scenario needs a unique name:

```tsx
export const scenarios = [
  { name: 'New customer', props: { name: 'Robin' } },
  { name: 'Returning customer', props: { name: 'Alex' } },
];
```

Each email appears once in the sidebar. A scenario selector appears beside its subject and preview when needed. Email selection, scenario, viewport size, text/HTML view, live updates, and dark-mode settings are stored in the URL.

The server compiles JSX using Preact, including in a project whose main tsconfig uses React. TypeScript path aliases remain available. Templates use the project's installed core and Preact packages. Rendering uses `renderAsync`, supporting Suspense and the separately installed Tailwind component. It does not add support for React Server Components or arbitrary async function components.

```sh
preact-email-preview --dir ./src/emails --port 3001
preact-email-preview --static-dir ./public/email-assets
preact-email-preview --host             # listen on all network interfaces
preact-email-preview --host 192.168.1.10 # listen on a specific interface
```

`PORT` also sets the default port. The server binds to `127.0.0.1` unless `--host` is supplied. This is a development server for trusted local templates.

Files in `<email directory>/static` are served at `/static/`; images in `<email directory>/assets` are also available at `/assets/`. Use these paths in templates, for example `<Img src="/static/logo.png" />`. Supported assets include common image formats, WOFF fonts, and CSS.

Live updates are enabled by default, including changes to imported helpers outside the emails directory. Disconnections show a retry overlay; reconnecting refreshes the selected email. Compilation and rendering errors appear in the viewer.

Dark-mode profiles approximate color changes and authored dark CSS. They do not emulate complete email-client rendering engines. The surrounding UI is currently fixed to light mode independently of the email simulation.

Programmatic use:

```ts
import { startPreview } from '@tallystone/preact-email-preview';
const server = await startPreview({ cwd: process.cwd(), dir: 'emails', port: 3000 });
// Later:
await server.close();
```

Direct runtime dependencies are esbuild and htmlparser2. Preact and `@tallystone/preact-email` are peers. React, React Email, a TSX runtime loader, and the optional Markdown/CodeBlock/Tailwind packages are not required.
