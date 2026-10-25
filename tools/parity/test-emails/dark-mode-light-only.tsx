import { Button, Heading, Section, Text } from '@hillac/preact-email';
import { DarkLayout, textStyle } from './components/dark-layout.js';

export interface LightOnlyProps {
  recipient: string;
  voucher: string;
  preserveLight: boolean;
}
export default function LightOnly({
  recipient,
  voucher,
  preserveLight,
}: LightOnlyProps) {
  return (
    <DarkLayout
      preview="A little thank-you for your next adventure."
      scheme={preserveLight ? 'light only' : 'none'}
    >
      <Heading style={{ color: '#202c3c', fontSize: '28px' }}>
        A little thank-you
      </Heading>
      <Text style={textStyle}>
        Hello {recipient}, thank you for sharing your trail notes with the
        community. We have set aside a small credit for your next workshop or
        field guide.
      </Text>
      <Section
        style={{
          backgroundColor: '#fff3d8',
          border: '2px solid #936a22',
          padding: '20px',
        }}
      >
        <Text style={{ color: '#503711', fontSize: '14px' }}>
          YOUR COMMUNITY CREDIT
        </Text>
        <Text style={{ color: '#503711', fontSize: '32px', fontWeight: 700 }}>
          $20.00
        </Text>
        <Text style={{ color: '#503711' }}>
          Use code <strong>{voucher}</strong> at checkout.
        </Text>
      </Section>
      <Text style={textStyle}>
        Your credit is available through the end of November. Choose something
        that gives you a fresh reason to head outdoors.
      </Text>
      <Button
        href="https://example.com/community-credit"
        style={{
          backgroundColor: '#503711',
          color: '#fff3d8',
          padding: '12px 20px',
        }}
      >
        Use your credit
      </Button>
    </DarkLayout>
  );
}
export const scenarios = [
  {
    name: 'light-only-opt-out',
    htmlContains: ['content="light only"'],
    htmlExcludes: ['content="light dark"'],
    props: { recipient: 'Robin', voucher: 'TRAIL-20', preserveLight: true },
    contains: ['A LITTLE THANK-YOU', '$20.00', 'TRAIL-20'],
    excludes: ['A little thank-you for your next adventure.'],
  },
  {
    name: 'no-opt-out-control',
    htmlExcludes: ['name="color-scheme"', 'name="supported-color-schemes"'],
    props: { recipient: 'Robin', voucher: 'TRAIL-20', preserveLight: false },
    contains: ['A LITTLE THANK-YOU', '$20.00', 'TRAIL-20'],
    excludes: ['A little thank-you for your next adventure.'],
  },
] satisfies Array<{
  name: string;
  props: LightOnlyProps;
  contains: string[];
  excludes: string[];
  htmlContains?: string[];
  htmlExcludes?: string[];
}>;
LightOnly.PreviewProps = scenarios[0]!.props;
LightOnly.Subject = () => 'A community credit, with our thanks';
