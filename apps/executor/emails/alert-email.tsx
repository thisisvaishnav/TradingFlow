import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type AlertEmailProps = {
  subject: string;
  body: string;
};

const BRAND_COLOR = "#2563eb";

export const AlertEmail = ({ subject, body }: AlertEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>TradingFlow</Heading>
        <Hr style={divider} />
        <Section style={content}>
          <Heading as="h2" style={heading}>
            {subject}
          </Heading>
          <Text style={bodyText}>{body}</Text>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          You received this because you have an active workflow on TradingFlow.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const logo: React.CSSProperties = {
  color: BRAND_COLOR,
  fontSize: "24px",
  fontWeight: 700,
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const divider: React.CSSProperties = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const content: React.CSSProperties = {
  padding: "0",
};

const heading: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 12px",
};

const bodyText: React.CSSProperties = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0",
  whiteSpace: "pre-wrap",
};

const footer: React.CSSProperties = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
};

export default AlertEmail;
