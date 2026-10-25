import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";
import { CSSProperties } from "react";
import { SimplePreview } from "./SimplePreview";

interface OuterTemplateProps {
  currentYear: string;
  preview: string;
  children?: React.ReactNode;
}

export const OuterTemplate = ({
  currentYear,
  preview,
  children,
}: OuterTemplateProps) => (
  <Html>
    <Head>
      <style>
        {/* Outlook needs type selector styles for the body. */}
        {`
          .link:hover {
            text-decoration: underline !important;
            color: #002646 !important;
          }
          .button:hover {
            background-color: #002646 !important;
            box-shadow: 3px 5px 8px rgba(20, 50, 70, 0.58) !important;
          }
          body {
            background-color: ${styles.main.backgroundColor};
            font-family: ${styles.main.fontFamily};
            ${styles.main.paddingLeft ? `padding-left: ${styles.main.paddingLeft};` : ""}
            ${styles.main.paddingRight ? `padding-right: ${styles.main.paddingRight};` : ""}
          }
        `}
      </style>
    </Head>
    {/* {preview && <SimplePreview>{preview}</SimplePreview>} */}
    {/* {preview && <Preview>{preview}</Preview>} */}
    <Body style={styles.main}>
      <Container style={styles.containerLogo}>
        <Img
          src="https://app.tallystone.com/tallystone-full-logo-blue.png"
          alt="Tallystone"
          width="200"
          style={styles.logoImg}
        />
      </Container>
      <Container style={styles.container}>{children}</Container>
      <Container style={styles.containerFooter}>
        <Text style={styles.footer}>
          &copy; {currentYear} Tallystone. All rights reserved.
        </Text>
        <Link
          href="https://www.tallystone.com"
          target="_blank"
          style={{ ...styles.footer, textDecoration: "underline" }}
          className="link"
        >
          www.tallystone.com
        </Link>
      </Container>
    </Body>
  </Html>
);

OuterTemplate.PreviewProps = {
  currentYear: "2025",
  preview: "Preview text",
} satisfies OuterTemplateProps;

const styles = {
  main: {
    backgroundColor: "#f4f4f4",
    paddingLeft: "3px",
    paddingRight: "3px",
    fontFamily: "Arial, sans-serif",
  },
  containerLogo: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "10px",
    textAlign: "center",
  },
  logoImg: {
    display: "block",
    margin: "20px auto",
  },
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #ced4da",
    boxShadow: "0 5px 10px rgba(20,50,70,.2)",
    borderRadius: "2px",
    padding: "30px 42px",
    paddingTop: "42px",
    textAlign: "left",
  },
  containerFooter: {
    maxWidth: "600px",
    margin: "0 auto",
    textAlign: "center",
    padding: "30px",
  },
  footer: {
    fontSize: "14px",
    color: "#868E96",
    margin: "5px 0",
  },
} satisfies { [key: string]: CSSProperties };

export default OuterTemplate;
