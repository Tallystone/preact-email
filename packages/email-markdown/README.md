# @tallystone/preact-email-markdown

Markdown for Preact email templates, adapted from React Email. Installs marked; the other optional component packages are independent.

```sh
pnpm add @tallystone/preact-email-markdown preact@^10.29.8
```

Use Preact JSX (`jsxImportSource: "preact"`).

```tsx
import { Markdown } from '@tallystone/preact-email-markdown';

const content = <Markdown>{'# Hello\nYour update is ready.'}</Markdown>;
```

Includes the upstream MIT license and a pinned source manifest.
