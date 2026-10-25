# @tallystone/preact-email-code-block

Syntax highlighting for Preact emails, powered by Prism.

```sh
pnpm add @tallystone/preact-email-code-block preact@10
```

```tsx
import { CodeBlock, dracula } from '@tallystone/preact-email-code-block';

<CodeBlock code="const ready = true;" language="javascript" theme={dracula} />
```

Use `"jsxImportSource": "preact"` in your tsconfig.
