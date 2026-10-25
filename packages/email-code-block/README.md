# @tallystone/preact-email-code-block

CodeBlock for Preact email templates, adapted from React Email. Installs Prism; the other optional component packages are independent.

```sh
pnpm add @tallystone/preact-email-code-block preact@^10.29.8
```

Use Preact JSX (`jsxImportSource: "preact"`).

```tsx
import { CodeBlock, dracula } from '@tallystone/preact-email-code-block';

const content = <CodeBlock code={'const ready = true;'} language="javascript" theme={dracula} />;
```

Includes the upstream MIT license and a pinned source manifest.
