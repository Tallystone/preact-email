# @tallystone/preact-email-tailwind

Tailwind for Preact email templates, adapted from React Email. Installs Tailwind CSS and css-tree; the other optional component packages are independent.

```sh
pnpm add @tallystone/preact-email-tailwind preact@^10.29.8
```

Use Preact JSX (`jsxImportSource: "preact"`).

```tsx
import { Tailwind } from '@tallystone/preact-email-tailwind';
import { Text, renderAsync } from '@tallystone/preact-email';

const html = await renderAsync(<Tailwind><Text className="text-blue-600">Hello</Text></Tailwind>);
```

Tailwind requires asynchronous rendering with `renderAsync` from `@tallystone/preact-email`. Install the core separately.

Includes the upstream MIT license and a pinned source manifest.
