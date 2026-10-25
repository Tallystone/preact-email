import type { ComponentChildren } from 'preact';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@tallystone/preact-email';

export function DarkLayout({
  preview,
  scheme = 'light dark',
  css,
  children,
}: {
  preview: string;
  scheme?: 'light dark' | 'light only' | 'none';
  css?: string;
  children: ComponentChildren;
}) {
  return (
    <Html lang="en">
      <Head>
        {scheme !== 'none' && <meta name="color-scheme" content={scheme} />}
        {scheme === 'light dark' && (
          <meta name="supported-color-schemes" content="light dark" />
        )}
        <style>{`
          :root { color-scheme: ${scheme === 'none' ? 'normal' : scheme}; }
          @media (max-width: 600px) { .dm-card { padding: 24px !important; } }
          ${css ?? ''}
        `}</style>
      </Head>
      <Body
        className="dm-page"
        style={{
          backgroundColor: '#eef1f5',
          margin: 0,
          padding: '32px 12px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Preview>{preview}</Preview>
        <Container
          className="dm-card"
          style={{
            maxWidth: '560px',
            backgroundColor: '#ffffff',
            color: '#202c3c',
            border: '1px solid #d4dce5',
            padding: '36px',
          }}
        >
          {children}
          <Text
            className="dm-muted"
            style={{ color: '#526174', fontSize: '12px', marginTop: '28px' }}
          >
            Fern Post · Thoughtful updates for curious people.
            <br />
            You received this message because you requested an update.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const darkColors = `
  .dm-page { background-color: #101820 !important; }
  .dm-card { background-color: #1c2938 !important; border-color: #425269 !important; color: #edf3fa !important; }
  .dm-heading, .dm-text { color: #edf3fa !important; }
  .dm-muted { color: #bbc9da !important; }
  .dm-link { color: #a9d4ff !important; }
  .dm-button { background-color: #badcff !important; color: #14283e !important; }
  .dm-panel { background-color: #293b50 !important; border-color: #425269 !important; }
`;
export const textStyle = {
  fontSize: '16px',
  lineHeight: '25px',
  color: '#202c3c',
};
