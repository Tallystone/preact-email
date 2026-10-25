// Compile the published API without React's global types.
import { Body, Button, Container, Heading, Html, Text, renderEmail } from '../../../packages/email/dist/index.js';
const result: { html: string; text: string } = renderEmail(
  <Html><Body><Container align="center"><Heading>Ready</Heading><Text>Hello</Text><Button href="https://example.com" style={{ padding: 16 }}>Open</Button></Container></Body></Html>,
);
void result;
import { Markdown } from '../../../packages/email-markdown/dist/vendor/markdown/index.js';
import { CodeBlock, dracula } from '../../../packages/email-code-block/dist/vendor/code-block/index.js';
import { Tailwind } from '../../../packages/email-tailwind/dist/vendor/tailwind/index.js';
const extras = <Tailwind><Markdown>{'# Hi'}</Markdown><CodeBlock language="javascript" theme={dracula} code="const n = 1" /></Tailwind>;
void extras;
