import { CodeInline, Heading, Link, Text } from '@hillac/preact-email';
import { ActionPanel, EmailShell, Facts, styles } from './components/layout.js';

export interface AccessNoticeProps {
  recipient: string;
  recognised: boolean;
  recoveryCode: string;
  includeRichNote: boolean;
}
export default function AccessNotice({
  recipient,
  recognised,
  recoveryCode,
  includeRichNote,
}: AccessNoticeProps) {
  return (
    <EmailShell preview="A recent visit to your Fern Post profile.">
      <ActionPanel
        recipient={recipient}
        introduction={
          <>
            A browser opened your profile from <strong>Lantern Bay</strong>.{' '}
            {recognised
              ? 'Your confirmation has been recorded.'
              : 'Review the details if this visit seems unfamiliar.'}
          </>
        }
        action={
          !recognised
            ? {
                label: 'Review recent visits',
                href: 'https://example.com/security?view=recent&from=email',
              }
            : undefined
        }
        afterAction={
          <>
            Reference key: <CodeInline>{recoveryCode}</CodeInline>. Keep this
            key with your personal records.
          </>
        }
      >
        <Facts
          entries={[
            ['Browser', 'Orchard 18'],
            ['Visit time', '20 April 2031, 09:15 UTC'],
            ['Status', recognised ? 'Confirmed by you' : 'Awaiting review'],
          ]}
        />
        <Heading as="h2" style={{ color: '#213b39', fontSize: '20px' }}>
          Record details
        </Heading>
        <pre
          style={{
            padding: '16px',
            backgroundColor: '#f0f4f2',
            fontSize: '12px',
            lineHeight: '20px',
            whiteSpace: 'pre-wrap',
          }}
        >{`visit: lantern-bay\n  reference: ${recoveryCode}\n  confirmed: ${recognised ? 'yes' : 'no'}`}</pre>
        {includeRichNote && (
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<p>Archive note: tea &amp; maps, 2 &lt; 3, and a clear horizon.</p><!--archive annotation--><p>Keep&nbsp;this reference together. <a href="https://example.com/security-guide?step=1&amp;mode=read" title="A &gt; B">Read the archive guide</a>.</p>',
            }}
          />
        )}
        <Text style={styles.text}>
          Explore <Link href="#record">record details</Link> or open{' '}
          <Link href="https://example.com/security">
            https://example.com/security
          </Link>
          .
        </Text>
      </ActionPanel>
    </EmailShell>
  );
}
export const scenarios = [
  {
    name: 'unrecognised-with-rich-html',
    props: {
      recipient: 'Sage',
      recognised: false,
      recoveryCode: 'FP-7M2Q-9R',
      includeRichNote: true,
    },
    contains: [
      'Awaiting review',
      'FP-7M2Q-9R',
      'tea & maps, 2 < 3',
      'Keep\u00a0this reference',
    ],
    excludes: [
      'A recent visit to your Fern Post profile.',
      'archive annotation',
    ],
  },
  {
    name: 'recognised-without-cta',
    props: {
      recipient: 'Renée',
      recognised: true,
      recoveryCode: 'FP-3A8D-4N',
      includeRichNote: false,
    },
    contains: ['Confirmed by you', 'confirmed: yes'],
    excludes: ['Review recent visits', 'Archive note:', 'Direct destination:'],
  },
] satisfies Array<{
  name: string;
  props: AccessNoticeProps;
  contains: string[];
  excludes: string[];
}>;

// Change the scenario index to preview another fixture variant.
AccessNotice.PreviewProps = scenarios[0]!.props;
