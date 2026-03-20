import { Resend } from "resend";
import { AlertEmail } from "../emails/alert-email.tsx";
import type { NotificationResult } from "./index.ts";

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "TradingFlow <onboarding@resend.dev>";

const resend = new Resend(RESEND_API_KEY);

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
  console.log(`[email] From: ${EMAIL_FROM}`);
  console.log(`[email] API key configured: ${RESEND_API_KEY ? "yes" : "NO"}`);

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: subject || "TradingFlow Alert",
      react: AlertEmail({
        subject: subject || "TradingFlow Alert",
        body: body || "",
      }),
    });

    if (error) {
      console.error("[email] Resend SDK error:", error);
      return {
        success: false,
        message: `Email send failed: ${error.message}`,
      };
    }

    console.log(`[email] Sent successfully, id: ${data?.id}`);

    return {
      success: true,
      message: `Email sent to ${to} (id: ${data?.id})`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[email] Unhandled error during send:", message);
    return {
      success: false,
      message: `Email send error: ${message}`,
    };
  }
};
