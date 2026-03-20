import { executeEmail } from "./email.ts";

export type NotificationResult = {
  success: boolean;
  message: string;
};

export type NotificationHandler = (
  metadata: Record<string, unknown>,
) => Promise<NotificationResult>;

const notificationHandlers: Record<string, NotificationHandler> = {
  Email: executeEmail,
};

export const getNotificationHandler = (
  nodeType: string,
): NotificationHandler | null => {
  return notificationHandlers[nodeType] ?? null;
};
