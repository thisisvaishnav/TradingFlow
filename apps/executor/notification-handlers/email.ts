import type { NotificationResult } from "./index.ts";

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "TradingFlow <alerts@tradingflow.app>";

export const executeEmail = async (
  metadata: Record<string, unknown>,
): Promise<NotificationResult> => {
  const { to, subject, body } = metadata as unknown as EmailPayload;

  if (!to) {
    return { success: false, message: "Missing recipient email address" };
  }

  if (!RESEND_API_KEY) {
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  console.log(`[email] Sending to ${to}: "${subject}"`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: subject || "TradingFlow Alert",
      text: body || "",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[email] Resend API error (${response.status}):`, errorBody);
    return {
      success: false,
      message: `Email send failed (${response.status}): ${errorBody}`,
    };
  }

  const result = await response.json();
  console.log(`[email] Sent successfully, id: ${result.id}`);

  return {
    success: true,
    message: `Email sent to ${to} (id: ${result.id})`,
  };
};
