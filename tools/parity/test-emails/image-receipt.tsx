import { Body, Container, Heading, Head, Html, Img, Text } from '@tallystone/preact-email';

// No Schema, Subject, PreviewProps or Scenarios: a plain email is valid too.
export default function ImageReceipt() {
  return <Html><Head /><Body><Container>
    <Img src="https://example.com/logo.png" alt="Harbor Supply logo" width={120} />
    <Heading>Your parcel is on its way</Heading>
    <Text>We have packed your order and handed it to the courier. Keep this message for your records, and contact our team if you need help with delivery.</Text>
    <Img src="https://example.com/parcel.png" aria-label="Packed parcel" width={240} />
    <Img src="https://example.com/divider.png" alt="" width={240} />
  </Container></Body></Html>;
}
