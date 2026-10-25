# @tallystone/preact-email-tailwind

Tailwind CSS for Preact emails. Requires async rendering.

```sh
pnpm add @tallystone/preact-email-tailwind @tallystone/preact-email preact
```

```tsx
import { Tailwind } from '@tallystone/preact-email-tailwind';
import { Text, renderAsync } from '@tallystone/preact-email';

const html = await renderAsync(
  <Tailwind><Text className="text-blue-600">Hello!</Text></Tailwind>,
);
```

Use `"jsxImportSource": "preact"` in your tsconfig.
