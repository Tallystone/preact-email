import { Body, Button, CodeInline, Column, Container, Font, Head, Heading, Hr, Html, Img, Link, Preview, Row, Section, Text } from '@tallystone/preact-email';
import { Markdown } from '@tallystone/preact-email-markdown';
import { CodeBlock, dracula } from '@tallystone/preact-email-code-block';
import { Tailwind } from '@tallystone/preact-email-tailwind';

export default function ComponentShowcase({ name = 'Robin' }: { name?: string }) {
  return <Tailwind><Html><Head>
    <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{ url: 'https://example.com/inter.woff2', format: 'woff2' }} />
  </Head><Body className="bg-slate-100"><Preview>Your developer workspace is ready</Preview>
    <Container className="bg-white p-8">
      <Img src="https://example.com/logo.png" alt="Harbor Tools logo" width={120} />
      <Heading className="text-slate-900">Welcome, {name}</Heading>
      <Text>Your workspace is ready. Here are the details you need to connect your application and send your first request.</Text>
      <Section><Row><Column><Text>Environment: sandbox</Text></Column><Column><Text>Status: ready</Text></Column></Row></Section>
      <Markdown>{'## Getting started\n\n1. Create an **API key**.\n2. Read the [integration guide](https://example.com/docs).\n\n| Feature | Status |\n| --- | --- |\n| Email | Ready |'}</Markdown>
      <Text>Set <CodeInline>API_KEY</CodeInline> before running:</Text>
      <CodeBlock code={'const client = new Client();\nawait client.send({ message: "Hello" });'} language="javascript" theme={dracula} />
      <Button href="https://example.com/dashboard" className="bg-blue-600 px-4 py-2 text-white">Open workspace</Button>
      <Hr /><Link href="https://example.com/support">Contact support</Link>
    </Container>
  </Body></Html></Tailwind>;
}
ComponentShowcase.Scenarios = [
  { name: 'developer', props: { name: 'Robin' }, asyncOnly: true, contains: ['WELCOME, ROBIN', 'GETTING STARTED'], excludes: [] },
];
