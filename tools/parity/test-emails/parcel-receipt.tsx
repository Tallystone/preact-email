import { Column, Heading, Img, Row, Section, Text } from '@tallystone/preact-email';
import { ActionPanel, EmailShell, Facts, styles } from './components/layout.js';

interface Item {
  name: string;
  quantity: number;
  priceCents: number;
}
export interface ParcelReceiptProps {
  recipient: string;
  order: string;
  items: Item[];
  dispatched: boolean;
  creditCents: number;
}
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
function ParcelItem({ item }: { item: Item }) {
  return (
    <Row>
      <Column width="64">
        <Img
          src="https://example.com/field-kit.png"
          alt="Field kit illustration"
          width={48}
          height={48}
          style={{ borderRadius: '4px' }}
        />
      </Column>
      <Column style={{ padding: '8px 12px' }}>
        <Text style={{ ...styles.text, margin: 0 }}>
          <strong>{item.name}</strong>
          <br />
          Quantity: {item.quantity}
        </Text>
      </Column>
      <Column align="right">
        <Text style={styles.text}>
          {money(item.quantity * item.priceCents)}
        </Text>
      </Column>
    </Row>
  );
}
export default function ParcelReceipt({
  recipient,
  order,
  items,
  dispatched,
  creditCents,
}: ParcelReceiptProps) {
  const total =
    items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0) -
    creditCents;
  return (
    <EmailShell preview={`Packing notes for parcel ${order}.`}>
      <ActionPanel
        recipient={recipient}
        introduction={
          <>
            Your field supplies are{' '}
            {dispatched ? (
              <strong>on their way</strong>
            ) : (
              <strong>being assembled</strong>
            )}
            . This is the itemised record for parcel <strong>{order}</strong>.
          </>
        }
        action={
          dispatched
            ? {
                label: 'Follow the parcel',
                href: `https://example.com/parcels/${order}`,
              }
            : undefined
        }
        note={
          !dispatched
            ? {
                title: 'Packing desk update',
                content: (
                  <>
                    The next collection is tomorrow.
                    <br />
                    We will send tracking details after the carrier scans your
                    parcel.
                  </>
                ),
              }
            : undefined
        }
        afterAction={<>Any adjustment appears on the same payment statement.</>}
      >
        <Heading as="h2" style={{ fontSize: '19px', color: '#213b39' }}>
          Inside your parcel
        </Heading>
        <Section
          style={{
            borderTop: '2px solid #16756b',
            borderBottom: '1px solid #ceded6',
          }}
        >
          {items.map((item) => (
            <ParcelItem key={item.name} item={item} />
          ))}
        </Section>
        <Facts
          entries={[
            ['Applied credit', money(creditCents)],
            ['Amount paid', money(total)],
            ['Delivery method', 'Carbon-conscious ground service'],
          ]}
        />
        <Text style={styles.text}>
          Delivery address:
          <br />
          Avery Quinn
          <br />
          24 Meadow Walk
          <br />
          North Harbour, NH 2048
        </Text>
      </ActionPanel>
    </EmailShell>
  );
}
ParcelReceipt.Scenarios = [
  {
    name: 'dispatched-multiple-items',
    props: {
      recipient: 'Avery',
      order: 'FP-1048',
      items: [
        { name: 'Pocket field journal', quantity: 2, priceCents: 1250 },
        { name: 'Rain cover — moss green', quantity: 1, priceCents: 1895 },
      ],
      dispatched: true,
      creditCents: 500,
    },
    contains: ['Pocket field journal', '$38.95', 'North Harbour'],
    excludes: ['Packing desk update', 'Packing notes for parcel'],
  },
  {
    name: 'pending-free-replacement',
    props: {
      recipient: 'Ellis',
      order: 'FP-1050',
      items: [{ name: 'Replacement compass cord', quantity: 1, priceCents: 0 }],
      dispatched: false,
      creditCents: 0,
    },
    contains: ['$0.00', 'Packing desk update'],
    excludes: ['Follow the parcel', 'Direct destination:'],
  },
] satisfies Array<{
  name: string;
  props: ParcelReceiptProps;
  contains: string[];
  excludes: string[];
}>;

// Change the scenario index to preview another fixture variant.
ParcelReceipt.PreviewProps = ParcelReceipt.Scenarios[0]!.props;
