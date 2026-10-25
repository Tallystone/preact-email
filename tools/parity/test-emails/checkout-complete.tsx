import { Column, Heading, Row, Section, Text } from '@hillac/preact-email';
import { ActionPanel, EmailShell, Facts, styles } from './components/layout.js';

export interface CartItem {
  sku: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPriceCents: number;
}
export interface CheckoutCompleteProps {
  recipient: string;
  orderId: string;
  cart: CartItem[];
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  deliveryAddress?: string[];
}
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function CartLine({ item }: { item: CartItem }) {
  return (
    <Row>
      <Column style={{ padding: '12px', borderBottom: '1px solid #d8e2ea' }}>
        <Text style={{ ...styles.text, margin: 0 }}>
          <strong>{item.name}</strong>
          {item.variant && (
            <>
              <br />
              {item.variant}
            </>
          )}
          <br />
          Quantity: {item.quantity} · Unit price: {money(item.unitPriceCents)}
        </Text>
      </Column>
      <Column
        align="right"
        style={{ padding: '12px', borderBottom: '1px solid #d8e2ea' }}
      >
        <Text style={styles.text}>
          {money(item.quantity * item.unitPriceCents)}
        </Text>
      </Column>
    </Row>
  );
}

export default function CheckoutComplete({
  recipient,
  orderId,
  cart,
  shippingCents,
  taxCents,
  discountCents,
  deliveryAddress,
}: CheckoutCompleteProps) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const total = subtotal + shippingCents + taxCents - discountCents;
  return (
    <EmailShell preview={`Your checkout receipt for ${orderId}.`}>
      <ActionPanel
        recipient={recipient}
        introduction={
          <>
            Your checkout is complete. We have recorded order{' '}
            <strong>{orderId}</strong>; your receipt is below.
          </>
        }
        action={{
          label: 'View your order',
          href: `https://example.com/orders/${encodeURIComponent(orderId)}`,
        }}
        afterAction={<>Keep this receipt for your records.</>}
      >
        <Heading as="h1" style={{ color: '#284b73', fontSize: '26px' }}>
          Checkout complete
        </Heading>
        <Section
          style={{ backgroundColor: '#f2f6fa', borderTop: '3px solid #527da6' }}
        >
          {cart.map((item) => (
            <CartLine key={item.sku} item={item} />
          ))}
        </Section>
        <Facts
          entries={[
            ['Subtotal', money(subtotal)],
            ['Discount', money(discountCents)],
            ['Shipping', money(shippingCents)],
            ['Tax', money(taxCents)],
            ['Total paid', money(total)],
          ]}
        />
        {deliveryAddress ? (
          <Section>
            <Heading as="h2" style={{ fontSize: '18px' }}>
              Delivery address
            </Heading>
            <Text style={styles.text}>
              {deliveryAddress.map((line, index) => (
                <span key={index}>
                  {line}
                  <br />
                </span>
              ))}
            </Text>
          </Section>
        ) : (
          <Text style={styles.text}>
            Digital delivery: your files are available on the order page.
          </Text>
        )}
        {total === 0 && (
          <Text style={styles.text}>
            No payment was required for this order.
          </Text>
        )}
      </ActionPanel>
    </EmailShell>
  );
}
export const scenarios = [
  {
    name: 'mixed-cart-with-discount',
    props: {
      recipient: 'Morgan',
      orderId: 'FP-2041',
      cart: [
        {
          sku: 'journal',
          name: 'Coastal notebook',
          variant: 'Ocean blue',
          quantity: 2,
          unitPriceCents: 1650,
        },
        {
          sku: 'pencils',
          name: 'Drawing pencils',
          quantity: 3,
          unitPriceCents: 450,
        },
        {
          sku: 'case',
          name: 'Canvas tool case',
          variant: 'Small',
          quantity: 1,
          unitPriceCents: 2400,
        },
      ],
      shippingCents: 650,
      taxCents: 705,
      discountCents: 1000,
      deliveryAddress: ['Morgan Lee', '18 Lantern Lane', 'West Haven 4020'],
    },
    contains: [
      'CHECKOUT COMPLETE',
      'Coastal notebook',
      'Quantity: 3',
      '$70.50',
      '$74.05',
      '18 Lantern Lane',
    ],
    excludes: [
      'Digital delivery:',
      'No payment was required',
      'Your checkout receipt for',
    ],
  },
  {
    name: 'digital-cart-with-special-characters',
    props: {
      recipient: 'Renée',
      orderId: 'FP-2042',
      cart: [
        {
          sku: 'map',
          name: 'Map <Edition> & "Guide"',
          variant: 'PDF — français',
          quantity: 2,
          unitPriceCents: 975,
        },
        {
          sku: 'notes',
          name: 'Trail notes & sketches',
          quantity: 1,
          unitPriceCents: 500,
        },
      ],
      shippingCents: 0,
      taxCents: 0,
      discountCents: 0,
    },
    contains: [
      'Map <Edition> & "Guide"',
      'PDF — français',
      '$24.50',
      'Digital delivery:',
    ],
    excludes: [
      'DELIVERY ADDRESS',
      'No payment was required',
      'Your checkout receipt for',
    ],
  },
  {
    name: 'fully-discounted-cart',
    props: {
      recipient: 'Jules',
      orderId: 'FP-2043',
      cart: [
        {
          sku: 'starter',
          name: 'Starter sketch pack',
          quantity: 1,
          unitPriceCents: 1200,
        },
      ],
      shippingCents: 0,
      taxCents: 0,
      discountCents: 1200,
    },
    contains: ['Starter sketch pack', '$0.00', 'No payment was required'],
    excludes: ['DELIVERY ADDRESS', 'Your checkout receipt for'],
  },
] satisfies Array<{
  name: string;
  props: CheckoutCompleteProps;
  contains: string[];
  excludes: string[];
}>;
CheckoutComplete.PreviewProps = scenarios[0]!.props;
