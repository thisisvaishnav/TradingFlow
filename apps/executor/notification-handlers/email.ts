import { Resend } from "resend";
import { render } from "@react-email/render";
import { AlertEmail } from "../emails/alert-email.tsx";
import type { NotificationResult } from "./index.ts";

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

export const executeEmail = async (
  metadata: Record<string, unknown>,
): Promise<NotificationResult> => {
  const { to, subject, body } = metadata as unknown as EmailPayload;

  if (!to) {
    return { success: false, message: "Missing recipient email address" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const emailFrom =
    process.env.EMAIL_FROM ?? "TradingFlow <onboarding@resend.dev>";
  const emailSubject = subject || "TradingFlow Alert";
  const emailBody = body || "";

  console.log(`[email] Sending to ${to}: "${emailSubject}"`);

  try {
    const html = await render(AlertEmail({ subject: emailSubject, body: emailBody }));

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [to],
      subject: emailSubject,
      html,
    });

    if (error) {
      console.error("[email] Resend API error:", JSON.stringify(error));
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] Unexpected error:", msg);
    return { success: false, message: `Email send threw: ${msg}` };
  }
};
