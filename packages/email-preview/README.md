# @tallystone/preact-email-preview

Lightweight Preact email previews with folder navigation, live reload, responsive sizing and dark-mode approximations. Renders in memory. Requires Node 22.18+.

```sh
pnpm add @tallystone/preact-email preact
pnpm add -D @tallystone/preact-email-preview
pnpm exec preact-email-preview --dir ./emails
```

Open http://localhost:3000. Defaults to `./emails`; use `--port` to change the port or `--host` to allow network access.

Each `.tsx` email exports a default component:

```tsx
import { Preview, Text } from '@tallystone/preact-email';

export default function Welcome({ name }: { name: string }) {
  return <><Preview>Your account is ready.</Preview><Text>Hello {name}!</Text></>;
}
Welcome.PreviewProps = { name: 'Robin' };
Welcome.Subject = ({ name }: { name: string }) => `Welcome, ${name}`;
```

For multiple previews, attach `.Scenarios`. The first is selected by default; `.PreviewProps` is only used when there are no scenarios:

```tsx
import type { Scenarios } from '@tallystone/preact-email';

Welcome.Scenarios = [
  { name: 'New customer', props: { name: 'Robin' } },
  { name: 'Returning customer', props: { name: 'Alex' } },
] satisfies Scenarios<{ name: string }>;
```

Nested folders appear in the sidebar. Put shared components in `components/` or prefix their names with `_`. Test files are excluded. Put images in `emails/static/` and reference `/static/logo.png`; use `--static-dir` for another asset directory.

`.Subject`, `.PreviewProps`, and `.Scenarios` are optional. An optional `.Schema` Zod validator parses props before previewing. For a typed render registry, use [preact-email-registry](../email-registry/README.md).
