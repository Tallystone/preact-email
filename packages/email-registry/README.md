# @tallystone/preact-email-registry

Generate a typed registry of email render functions. Zod validation is optional.

```sh
pnpm add @tallystone/preact-email-registry
pnpm exec preact-email-registry --dir ./emails --out ./emails.generated.ts
```

```ts
import { emails } from './emails.generated';

const { html, text, subject } = await emails.orders.receipt.render({ name: 'Robin' });
```

Folders become nested objects; `checkout-complete.tsx` becomes `checkoutComplete`. Run the generator when adding, renaming or removing emails, or before your build. Use an `_` prefix to exclude shared component files or folders.

For validation, install `zod` and attach a schema:

```tsx
import { z } from 'zod';
import { Text } from '@tallystone/preact-email';

const PropsSchema = z.object({ name: z.string().trim().min(1) });

export default function Receipt(props: z.output<typeof PropsSchema>) {
  return <Text>Hello {props.name}</Text>;
}
Receipt.Schema = PropsSchema;
Receipt.Subject = (props: z.output<typeof PropsSchema>) => `Thanks, ${props.name}`;
Receipt.PreviewProps = { name: 'Robin' };
```

`render()` accepts the schema's input type, validates it, then passes the parsed output to the email and subject. Async validation and transforms work. Access the validator through `emails.orders.receipt.schema`.

Without `.Schema`, props are inferred from the component. `.Subject`, `.PreviewProps`, and `.Scenarios` are also optional. `render()` is async; `renderSync()` returns the same HTML, plain text, and optional subject synchronously. Use `render()` for async schema refinements/transforms, async subjects, or async components such as Tailwind.

For a single email, skip generation:

```ts
import { createEmailRenderer } from '@tallystone/preact-email-registry';
const receipt = createEmailRenderer(Receipt);
const { html, text } = receipt.renderSync({ name: 'Robin' });
```
