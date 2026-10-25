import { Heading, Img, Link, Section, Text } from '@tallystone/preact-email';
import { DarkLayout, darkColors, textStyle } from './components/dark-layout.js';

export interface ImageSwapProps {
  recipient: string;
  edition: string;
  outlookOverrides: boolean;
}
const swap = `
  .logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
  .logo-dark { display: block !important; max-height: none !important; overflow: visible !important; }
`;
// Duplicate the authored rules with Outlook's selector hooks. These attributes
// are added by supported clients; never place them in the sent HTML yourself.
const outlookColors = darkColors.replace(
  /(^|\n)\s*(\.dm-[\w-]+(?:, \.dm-[\w-]+)*)/g,
  (_, prefix: string, selectors: string) =>
    prefix +
    selectors
      .split(', ')
      .map((s) => '[data-ogsc] ' + s)
      .join(', '),
);
export default function ImageSwap({
  recipient,
  edition,
  outlookOverrides,
}: ImageSwapProps) {
  return (
    <DarkLayout
      preview="Fresh notes from the ridgeline."
      css={`
        @media (prefers-color-scheme: dark) {
          ${darkColors} ${swap}
        }
        ${outlookOverrides ? outlookColors + swap.replace(/\.logo-/g, '[data-ogsc] .logo-') : ''}
      `}
    >
      <Link
        href="https://example.com/field-notes"
        aria-label="Fern Post field notes"
      >
        <Section className="logo-light">
          <Img
            src="/assets/dark-mode-logo-light.png"
            width={160}
            height={48}
            alt="Fern Post mountain emblem"
          />
        </Section>
        <Section
          className="logo-dark"
          style={{
            display: 'none',
            maxHeight: 0,
            overflow: 'hidden',
            msoHide: 'all',
          }}
        >
          <Img
            src="/assets/dark-mode-logo-dark.png"
            width={160}
            height={48}
            alt="Fern Post mountain emblem"
          />
        </Section>
      </Link>
      <Heading
        className="dm-heading"
        style={{ color: '#202c3c', fontSize: '28px' }}
      >
        Notes from the ridgeline
      </Heading>
      <Text className="dm-muted" style={{ color: '#526174' }}>
        {edition}
      </Text>
      <Text className="dm-text" style={textStyle}>
        Hello {recipient}, this week we followed the high path above the valley.
        The morning mist cleared just in time to reveal a line of distant peaks.
      </Text>
      <Text className="dm-text" style={textStyle}>
        Our new field notes include three short walks, a packing checklist, and
        a quiet place to stop for lunch. Save them for a day when you have room
        to wander.
      </Text>
      <Link
        className="dm-link"
        href="https://example.com/field-notes"
        style={{ color: '#254c77' }}
      >
        Read the field notes
      </Link>
    </DarkLayout>
  );
}
export const scenarios = [
  {
    name: 'apple-css-only',
    htmlContains: [
      '/assets/dark-mode-logo-light.png',
      '/assets/dark-mode-logo-dark.png',
      '@media (prefers-color-scheme: dark)',
    ],
    htmlExcludes: ['[data-ogsc]'],
    props: {
      recipient: 'Lee',
      edition: 'Early autumn edition',
      outlookOverrides: false,
    },
    contains: ['NOTES FROM THE RIDGELINE', 'Early autumn edition'],
    excludes: ['Fresh notes from the ridgeline.'],
  },
  {
    name: 'apple-and-outlook-hooks',
    htmlContains: [
      '[data-ogsc] .logo-dark',
      '[data-ogsc] .dm-card',
      'mso-hide:all',
    ],
    props: {
      recipient: 'Noor',
      edition: 'Late autumn edition',
      outlookOverrides: true,
    },
    contains: ['NOTES FROM THE RIDGELINE', 'Late autumn edition'],
    excludes: ['Fresh notes from the ridgeline.'],
  },
] satisfies Array<{
  name: string;
  props: ImageSwapProps;
  contains: string[];
  excludes: string[];
  htmlContains?: string[];
  htmlExcludes?: string[];
}>;
ImageSwap.PreviewProps = scenarios[0]!.props;
ImageSwap.Subject = ({ edition }: ImageSwapProps) => `Field notes · ${edition}`;
