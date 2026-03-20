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

const ACCENT = "#10b981";

export const AlertEmail = ({ subject, body }: AlertEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>
            <span style={logoChevron}>≫</span> TRADINGFLOW
          </Text>
        </Section>
        <Hr style={divider} />
        <Section style={content}>
          <Text style={label}>ALERT</Text>
          <Heading as="h2" style={heading}>
            {subject}
          </Heading>
          <Section style={bodyCard}>
            <Text style={bodyText}>{body}</Text>
          </Section>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          You received this because you have an active workflow on TradingFlow.
        </Text>
        <Text style={version}>v0.1.0 // OPERATIONAL</Text>
      </Container>
    </Body>
  </Html>
);

const main: React.CSSProperties = {
  backgroundColor: "#09090b",
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#18181b",
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  borderRadius: "0",
  border: "1px solid #3f3f46",
};

const header: React.CSSProperties = {
  padding: "0",
};

const logo: React.CSSProperties = {
  color: "#fafafa",
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  margin: "0",
};

const logoChevron: React.CSSProperties = {
  color: ACCENT,
  marginRight: "4px",
};

const divider: React.CSSProperties = {
  borderColor: "#3f3f46",
  margin: "20px 0",
};

const content: React.CSSProperties = {
  padding: "0",
};

const label: React.CSSProperties = {
  color: ACCENT,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
};

const heading: React.CSSProperties = {
  color: "#fafafa",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 16px",
  letterSpacing: "-0.025em",
};

const bodyCard: React.CSSProperties = {
  backgroundColor: "#27272a",
  border: "1px solid #3f3f46",
  padding: "16px",
  borderRadius: "0",
};

const bodyText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
};

const footer: React.CSSProperties = {
  color: "#71717a",
  fontSize: "11px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "0 0 4px",
};

const version: React.CSSProperties = {
  color: "#52525b",
  fontSize: "9px",
  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
  textAlign: "center" as const,
  margin: "0",
  letterSpacing: "0.05em",
};

export default AlertEmail;
