import { Button, Heading, Link, Section, Text } from '@tallystone/preact-email';
import { DarkLayout, darkColors, textStyle } from './components/dark-layout.js';

export interface AuthoredDarkProps {
  recipient: string;
  confirmed: boolean;
}
export default function AuthoredDark({
  recipient,
  confirmed,
}: AuthoredDarkProps) {
  return (
    <DarkLayout
      preview="A place to learn, in any light."
      css={`
        @media (prefers-color-scheme: dark) {
          ${darkColors}
        }
      `}
    >
      <Text className="dm-muted" style={{ color: '#526174', fontSize: '12px' }}>
        FERN POST WORKSHOPS
      </Text>
      <Heading
        className="dm-heading"
        style={{ color: '#202c3c', fontSize: '28px' }}
      >
        {confirmed ? 'Your place is reserved' : 'A new workshop awaits'}
      </Heading>
      <Text className="dm-text" style={textStyle}>
        Hello {recipient}, join us for an evening of drawing the changing sky.
        Bring a notebook and your curiosity; we will supply the rest.
      </Text>
      <Section
        className="dm-panel"
        style={{
          backgroundColor: '#f2f6fb',
          border: '1px solid #d4dce5',
          padding: '16px',
        }}
      >
        <Text className="dm-text" style={textStyle}>
          Sky sketching
          <br />
          Thursday, 18 September · 6:30 pm
          <br />
          The Lantern Studio
        </Text>
      </Section>
      <Text className="dm-text" style={textStyle}>
        {confirmed
          ? 'Your materials will be waiting at the welcome desk.'
          : 'There are a few seats left for this small-group session.'}
      </Text>
      <Button
        className="dm-button"
        href="https://example.com/workshops/sky"
        style={{
          backgroundColor: '#254c77',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '4px',
        }}
      >
        {confirmed ? 'View your reservation' : 'Explore the workshop'}
      </Button>
      <Text className="dm-muted" style={{ color: '#526174' }}>
        Questions?{' '}
        <Link
          className="dm-link"
          href="mailto:studio@example.com"
          style={{ color: '#254c77' }}
        >
          Write to the studio
        </Link>
        .
      </Text>
    </DarkLayout>
  );
}
AuthoredDark.Scenarios = [
  {
    name: 'invitation',
    htmlContains: [
      'content="light dark"',
      '@media (prefers-color-scheme: dark)',
      '.dm-button',
    ],
    props: { recipient: 'Ari', confirmed: false },
    contains: ['A NEW WORKSHOP AWAITS', 'few seats left'],
    excludes: ['materials will be waiting', 'A place to learn, in any light.'],
  },
  {
    name: 'reservation',
    htmlContains: [
      'content="light dark"',
      '@media (prefers-color-scheme: dark)',
    ],
    props: { recipient: 'Marin', confirmed: true },
    contains: ['YOUR PLACE IS RESERVED', 'materials will be waiting'],
    excludes: ['few seats left', 'A place to learn, in any light.'],
  },
] satisfies Array<{
  name: string;
  props: AuthoredDarkProps;
  contains: string[];
  excludes: string[];
  htmlContains?: string[];
  htmlExcludes?: string[];
}>;
AuthoredDark.PreviewProps = AuthoredDark.Scenarios[0]!.props;
AuthoredDark.Subject = ({ confirmed }: AuthoredDarkProps) =>
  confirmed ? 'Your sky sketching reservation' : 'An evening of sky sketching';
