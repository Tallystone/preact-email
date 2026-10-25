import {
  Button,
  Container,
  Heading,
  Hr,
  Link,
  Text,
} from "@react-email/components";
import React, { CSSProperties } from "react";

interface InnerTemplateProps {
  userName?: string;
  bodyText?: React.ReactNode;
  body?: React.ReactNode;
  buttonText?: string;
  buttonLink?: string;
  brokenWarning?: boolean;
  expiresAt?: string;
  postButtonText?: React.ReactNode;
  enableDescription?: Boolean;
  PSText?: React.ReactNode;
  supportEmailText?: String;
  supportEmail?: string;
  customMessageTitle?: React.ReactNode;
  customMessage?: React.ReactNode;
}

export const InnerTemplate = ({
  userName,
  bodyText,
  body,
  buttonText,
  buttonLink,
  brokenWarning,
  expiresAt,
  postButtonText,
  enableDescription,
  PSText,
  supportEmailText,
  supportEmail,
  customMessageTitle,
  customMessage,
}: InnerTemplateProps) => {
  return (
    <>
      <Container style={styles.containerInternal}>
        {userName && <Heading style={styles.h1}>Hi {userName},</Heading>}
        {bodyText && <Text style={styles.text}>{bodyText}</Text>}
        {body && body}
        {customMessage && customMessageTitle && (
          <Container style={styles.containerCustomMessage}>
            <Text
              style={{
                ...styles.text,
                fontSize: "14px",
                fontWeight: "bold",
                marginTop: "0",
              }}
            >
              {customMessageTitle}
            </Text>
            <Text
              style={{ ...styles.text, fontSize: "14px", marginBottom: "0" }}
            >
              {customMessage}
            </Text>
          </Container>
        )}
        {buttonText && buttonLink && (
          <Container style={styles.containerButton}>
            {brokenWarning && (
              <Text
                style={{
                  ...styles.text,
                  color: "#006dff",
                  fontSize: "20px",
                  marginBottom: "0px",
                }}
              >
                <b>We recommend opening this link on a laptop.</b>
              </Text>
            )}
            <Button
              href={buttonLink}
              target="_blank"
              style={{
                ...styles.button,
                ...(expiresAt && { marginBottom: "10px" }), // Decrease margin if expiresAt is present
              }}
              className="button"
            >
              <b>{buttonText}</b>
            </Button>
            {expiresAt && (
              <Text
                style={{
                  ...styles.text,
                  color: "#5C5F66",
                  fontSize: "14px",
                  marginTop: "0px",
                }}
              >
                <b>Expires: {expiresAt}</b>
              </Text>
            )}
          </Container>
        )}
        {postButtonText && <Text style={styles.text}>{postButtonText}</Text>}
        {enableDescription && (
          <Text style={styles.text}>
            Tallystone is an automatic data room that allows companies to easily
            create, organise and share information.
          </Text>
        )}
        {/* <Text style={styles.text}>- Team Tallystone</Text> */}
        {PSText && (
          <Text
            style={{
              ...styles.text,
              fontStyle: "italic",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {PSText}
          </Text>
        )}
      </Container>
      <Hr style={styles.divider} />
      <Container style={styles.containerInternal}>
        <Text style={{ ...styles.text, color: "#5C5F66", fontSize: "14px" }}>
          <b>Need help?</b>
          {" Check out our "}
          <Link
            href="https://tallystone.brainfish.ai"
            target="_blank"
            style={styles.emailLink}
            className="link"
          >
            AI Help Centre
          </Link>
          {supportEmailText ? (
            <>
              <br />
              {supportEmailText}
            </>
          ) : (
            " or contact us anytime via "
          )}
          <Link
            href={`mailto:${supportEmail ?? "support@tallystone.com"}`}
            target="_blank"
            style={styles.emailLink}
            className="link"
          >
            {supportEmail}
          </Link>
        </Text>
        {buttonText && buttonLink && (
          <Text style={{ ...styles.text, color: "#5C5F66", fontSize: "14px" }}>
            If you're having any problems with the button, copy and paste this
            URL into your browser:{" "}
            <b
              style={{
                wordBreak: "break-all",
              }}
            >
              {buttonLink}
            </b>
          </Text>
        )}
      </Container>
    </>
  );
};

InnerTemplate.PreviewProps = {
  userName: "User",
  bodyText: (
    <>
      This is the body text. It is a node and can JSX like <b>bold</b> or{" "}
      <Link href="#">links</Link>. The PSText is also a node. It is inside a
      text component and as such can only contain html nodes that can be inside{" "}
      {"<p>"}
    </>
  ),
  body: <p>Example body. This is a react node and can be anything</p>,
  buttonText: "Click me",
  buttonLink: "https://example.com",
  expiresAt: "30/03/2025",
  postButtonText: (
    <>
      This is the post button text. It is a node and can JSX like <b>bold</b> or{" "}
      <a href="#">links</a>.
    </>
  ),
  enableDescription: true,
  PSText: <>This is the PS text</>,
  supportEmailText: "This is the support email text",
  supportEmail: "support@tallystone.com",
  customMessageTitle: "MESSAGE FROM SENDER",
  customMessage: (
    <>
      This is the body text. It is a node and can JSX like <b>bold</b> or{" "}
      <a href="#">links</a>.
    </>
  ),
} satisfies InnerTemplateProps;

const styles = {
  containerInternal: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "0",
    textAlign: "left",
  },
  containerButton: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "0",
    textAlign: "center",
  },
  containerCustomMessage: {
    backgroundColor: "#ffffff",
    border: "1px solid #CED4DA",
    padding: "20px",
    borderRadius: "2px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  h1: {
    fontSize: "20px",
    color: "#25262B",
    fontWeight: "bold",
    margin: "0 0 16px",
  },
  text: {
    fontSize: "16px",
    color: "#25262B",
    lineHeight: "1.5",
    margin: "12px 0",
  },
  emailLink: {
    fontSize: "14px",
    color: "#006dff",
    lineHeight: "1.5",
    margin: "12px 0",
  },
  button: {
    backgroundColor: "#006dff",
    color: "#ffffff",
    textDecoration: "none",
    padding: "15px 30px",
    borderRadius: "2px",
    fontSize: "16px",
    margin: "20px 0",
    minWidth: "100px",
    maxWidth: "600px",
    boxShadow: "0 5px 10px rgba(20,50,70,.2)",
  },
  divider: {
    marginTop: "16px",
    borderColor: "#CED4DA",
    marginBottom: "16px",
    borderTopWidth: "2px",
  },
} satisfies { [key: string]: CSSProperties };

export default InnerTemplate;
