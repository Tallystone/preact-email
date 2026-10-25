import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@hillac/preact-email';

const palette = {
  ink: '#213b39',
  muted: '#586e6b',
  accent: '#16756b',
  paper: '#f1f6f3',
  border: '#ceded6',
};
export const styles = {
  text: {
    color: palette.ink,
    fontSize: '15px',
    lineHeight: '25px',
    margin: '14px 0',
  },
  small: {
    color: palette.muted,
    fontSize: '12px',
    lineHeight: '19px',
    margin: '8px 0',
  },
  link: { color: palette.accent, textDecoration: 'underline' },
  card: {
    backgroundColor: '#f6faf8',
    border: `1px solid ${palette.border}`,
    borderRadius: '6px',
    padding: '18px 22px',
    margin: '20px 0',
  },
} satisfies Record<string, CSSProperties>;

export function EmailShell({
  preview,
  children,
  year = 2031,
}: {
  preview: string;
  children: ComponentChildren;
  year?: number;
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={400}
          fontStyle="normal"
        />
        <style>{`
          body { background-color: ${palette.paper}; font-family: Arial, sans-serif; }
          .action:hover { background-color: #10554e !important; }
          .help-link:hover { color: #123d38 !important; }
          @media (max-width: 640px) { .content-card { padding: 20px !important; } }
        `}</style>
      </Head>
      <Body
        style={{
          backgroundColor: palette.paper,
          padding: '12px 8px',
          margin: 0,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Preview>{preview}</Preview>
        <Container
          style={{ maxWidth: '640px', textAlign: 'center', padding: '22px 0' }}
        >
          <Img
            src="https://example.com/fern-post.png"
            alt="Fern Post emblem"
            width={168}
            height={36}
            style={{ margin: '0 auto' }}
          />
        </Container>
        <Container
          className="content-card"
          style={{
            maxWidth: '640px',
            padding: '32px 36px',
            border: `1px solid ${palette.border}`,
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 18px rgba(25,65,45,0.08)',
          }}
        >
          {children}
        </Container>
        <Container
          style={{
            maxWidth: '600px',
            textAlign: 'center',
            padding: '22px 16px',
          }}
        >
          <Text style={styles.small}>
            Fern Post · Independent journeys since 2028 · {year}
          </Text>
          <Link href="https://example.com/preferences" style={styles.link}>
            Choose your updates
          </Link>
          <Text style={styles.small}>18 Juniper Lane, Lantern Bay</Text>
        </Container>
      </Body>
    </Html>
  );
}

interface ActionPanelProps {
  recipient?: string;
  introduction?: ComponentChildren;
  children?: ComponentChildren;
  note?: { title: string; content: ComponentChildren };
  action?: {
    label: string;
    href: string;
    expires?: string;
    desktopHint?: boolean;
  };
  afterAction?: ComponentChildren;
  postscript?: ComponentChildren;
  showAbout?: boolean;
  supportAddress?: string;
  supportIntro?: string;
}

export function ActionPanel({
  recipient,
  introduction,
  children,
  note,
  action,
  afterAction,
  postscript,
  showAbout,
  supportAddress = 'guides@example.com',
  supportIntro,
}: ActionPanelProps) {
  return (
    <>
      <Container style={{ maxWidth: '568px', textAlign: 'left' }}>
        {recipient && (
          <Heading
            as="h1"
            style={{
              color: palette.ink,
              fontSize: '24px',
              lineHeight: '32px',
              margin: '0 0 18px',
            }}
          >
            A new chapter, {recipient}
          </Heading>
        )}
        {introduction && <Text style={styles.text}>{introduction}</Text>}
        {children}
        {note && (
          <Section style={styles.card}>
            <Text
              style={{
                ...styles.text,
                fontSize: '13px',
                fontWeight: 700,
                marginTop: 0,
              }}
            >
              {note.title}
            </Text>
            <Text style={{ ...styles.text, marginBottom: 0 }}>
              {note.content}
            </Text>
          </Section>
        )}
        {action && (
          <Section style={{ textAlign: 'center', padding: '8px 0' }}>
            {action.desktopHint && (
              <Text style={{ ...styles.small, color: '#86520b' }}>
                A larger display makes the route map easier to explore.
              </Text>
            )}
            <Button
              className="action"
              href={action.href}
              target="_blank"
              style={{
                backgroundColor: palette.accent,
                color: '#fff',
                padding: '14px 26px',
                borderRadius: '6px',
                fontSize: '16px',
                margin: action.expires ? '12px 0 8px' : '12px 0 20px',
                minWidth: '160px',
              }}
            >
              <strong>{action.label}</strong>
            </Button>
            {action.expires && (
              <Text style={styles.small}>
                Your place is held through <strong>{action.expires}</strong>.
              </Text>
            )}
          </Section>
        )}
        {afterAction && <Text style={styles.text}>{afterAction}</Text>}
        {showAbout && (
          <Text style={styles.text}>
            Fern Post brings small groups together for carefully paced outdoor
            adventures.
          </Text>
        )}
        {postscript && (
          <Text
            style={{ ...styles.small, fontStyle: 'italic', fontWeight: 600 }}
          >
            {postscript}
          </Text>
        )}
      </Container>
      <Hr
        style={{
          margin: '24px 0 18px',
          borderColor: palette.border,
          borderTopWidth: '1px',
        }}
      />
      <Section>
        <Text style={styles.small}>
          <strong>Planning a different route?</strong>{' '}
          <Link
            className="help-link"
            href="https://example.com/field-notes"
            style={styles.link}
          >
            Read the field notes
          </Link>
          {supportIntro ? (
            <>
              <br />
              {supportIntro}{' '}
            </>
          ) : (
            ' or write to '
          )}
          <Link href={`mailto:${supportAddress}`} style={styles.link}>
            {supportAddress}
          </Link>
          .
        </Text>
        {action && (
          <Text style={styles.small}>
            Direct destination:{' '}
            <Link
              href={action.href}
              style={{ ...styles.link, wordBreak: 'break-all' }}
            >
              {action.href}
            </Link>
          </Text>
        )}
      </Section>
    </>
  );
}

export function Facts({
  entries,
}: {
  entries: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <Section style={styles.card}>
      {entries.map(([label, value]) => (
        <Row key={label}>
          <Column
            width="42%"
            style={{ verticalAlign: 'top', paddingRight: '16px' }}
          >
            <Text style={styles.small}>{label}</Text>
          </Column>
          <Column style={{ verticalAlign: 'top' }}>
            <Text style={{ ...styles.text, margin: '6px 0', fontWeight: 600 }}>
              {value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
