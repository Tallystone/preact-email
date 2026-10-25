// Compile the published API without React's global types.
import { Body, Button, Img, Container, Heading, Html, Text, renderEmail } from '../../../packages/email/dist/index.js';
const result: { html: string; text: string } = renderEmail(
  <Html><Body><Container align="center"><Heading>Ready</Heading><Text>Hello</Text><Button href="https://example.com" style={{ padding: 16 }}>Open</Button></Container></Body></Html>,
);
void result;
import { Markdown } from '../../../packages/email-markdown/dist/vendor/markdown/index.js';
import { CodeBlock, dracula } from '../../../packages/email-code-block/dist/vendor/code-block/index.js';
import { Tailwind } from '../../../packages/email-tailwind/dist/vendor/tailwind/index.js';
const optionalComponents = <Tailwind><Markdown>{'# Hi'}</Markdown><CodeBlock language="javascript" theme={dracula} code="const n = 1" /></Tailwind>;
void optionalComponents;

const logo = <Img src="https://example.com/logo.png" alt="Logo" style={{ width: 120 }} />;
const labelledImage = <Img src="https://example.com/logo.png" aria-label="Logo" />;
void logo; void labelledImage;

import { z } from 'zod';
import { createEmailRenderer } from '../../../packages/email-registry/dist/index.js';
import { emails } from '../test-emails.generated.js';
const schema = z.object({ quantity: z.string().transform(Number) });
function ValidatedEmail(props: z.output<typeof schema>) { return <Text>{props.quantity + 1}</Text>; }
ValidatedEmail.Schema = schema;
const validated = createEmailRenderer(ValidatedEmail);
void validated.render({ quantity: '2' });
// @ts-expect-error Callers supply schema input, not transformed output.
void validated.render({ quantity: 2 });
// @ts-expect-error Required input cannot be omitted.
void validated.render();
void createEmailRenderer(() => <Text>Plain email</Text>).render();
void emails.imageReceipt.render();
void emails.checkoutComplete.schema.safeParse({});
// @ts-expect-error Generated registry preserves the checkout props.
void emails.checkoutComplete.render({ recipient: 123 });
// @ts-expect-error Unknown emails are not in the generated registry.
void emails.unknownEmail;
