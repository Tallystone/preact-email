import { Link, Text } from '@hillac/preact-email';
import { ActionPanel, EmailShell, Facts, styles } from './components/layout.js';

export interface TrailInvitationProps {
  recipient: string;
  organiser: string;
  trail: string;
  href: string;
  expires?: string;
  fullDetails: boolean;
}
export default function TrailInvitation({
  recipient,
  organiser,
  trail,
  href,
  expires,
  fullDetails,
}: TrailInvitationProps) {
  return (
    <EmailShell preview={`A trail briefing for ${recipient} is inside.`}>
      <ActionPanel
        recipient={recipient}
        introduction={
          <>
            <strong>{organiser}</strong> saved you a spot on{' '}
            <strong>{trail}</strong>. Review the itinerary before choosing your
            walking group.
          </>
        }
        action={{
          label: 'Explore the itinerary',
          href,
          expires,
          desktopHint: fullDetails,
        }}
        note={
          fullDetails
            ? {
                title: 'A note from the trail leader',
                content: (
                  <>
                    Bring a light layer &amp; a refillable bottle.
                    <br />
                    The final stretch has <em>wide valley views</em>.
                  </>
                ),
              }
            : undefined
        }
        afterAction={
          fullDetails ? (
            <>
              Your preferences stay editable in{' '}
              <Link href="https://example.com/profile">
                your walking profile
              </Link>
              .
            </>
          ) : undefined
        }
        postscript={
          fullDetails ? (
            <>Keep the morning unhurried—we have built in a picnic stop.</>
          ) : undefined
        }
        showAbout={fullDetails}
        supportAddress="trail-team@example.com"
        supportIntro={
          fullDetails
            ? 'For accessibility arrangements, reach the trail team at'
            : undefined
        }
      >
        {fullDetails && (
          <>
            <Facts
              entries={[
                ['Meeting point', 'East gate pavilion'],
                ['Distance', '8.5 km'],
                ['Walking groups', '3'],
                ['Equipment hire', '$0'],
              ]}
            />
            <Text style={styles.text}>Before departure:</Text>
            <ol start={2}>
              <li>Choose a comfortable pace.</li>
              <li>
                Check the{' '}
                <Link href="https://example.com/forecast?day=1&area=valley">
                  local forecast
                </Link>
                .
              </li>
              <li>Save your meeting point.</li>
            </ol>
          </>
        )}
      </ActionPanel>
    </EmailShell>
  );
}
export const scenarios = [
  {
    name: 'all-sections',
    props: {
      recipient: 'Mara',
      organiser: 'Cedar Walking Club',
      trail: 'The Lantern Ridge Loop',
      href: 'https://example.com/trails/lantern?group=early&pace=easy',
      expires: '18 May 2031, 17:00 UTC',
      fullDetails: true,
    },
    contains: [
      'Cedar Walking Club',
      'East gate pavilion',
      'Equipment hire',
      '$0',
      '18 May 2031',
    ],
    excludes: ['A trail briefing for Mara is inside.'],
  },
  {
    name: 'compact-unicode',
    props: {
      recipient: 'Zoë',
      organiser: 'Río & Pine',
      trail: 'Côte des Pins',
      href: 'https://example.com/trails/coast',
      fullDetails: false,
    },
    contains: ['ZOË', 'Río & Pine', 'Côte des Pins'],
    excludes: [
      'A note from the trail leader',
      'Your place is held',
      'Equipment hire',
    ],
  },
] satisfies Array<{
  name: string;
  props: TrailInvitationProps;
  contains: string[];
  excludes: string[];
}>;

// Change the scenario index to preview another fixture variant.
TrailInvitation.PreviewProps = scenarios[0]!.props;
