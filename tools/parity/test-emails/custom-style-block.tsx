import { Body, Head, Heading, Html, Text } from "@tallystone/preact-email";

export default function CustomStyleBlock() {
  return (
    <Html>
      <Head>
        <style
          dangerouslySetInnerHTML={{
            __html: 'a[data-theme="dark"] { color: red; }',
          }}
        />
      </Head>
      <Body>
        <Heading>Custom style block</Heading>
        <Text>
          This email uses a custom style block to turn the dark-themed link red.
          The regular link keeps its default appearance for comparison.
        </Text>
        <Text>
          <a data-theme="dark" href="https://example.com/dark">
            Dark-themed link
          </a>
        </Text>
        <Text>
          <a href="https://example.com/default">Regular link</a>
        </Text>
      </Body>
    </Html>
  );
}

CustomStyleBlock.Scenarios = [
  {
    name: "custom-style-block",
    props: {},
    htmlContains: [
      '<style>a[data-theme="dark"] { color: red; }</style>',
      'data-theme="dark"',
    ],
    contains: ["Dark-themed link", "Regular link"],
    excludes: ["color: red;"],
  },
];
