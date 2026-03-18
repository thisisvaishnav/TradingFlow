import type { TradingMetadata } from "common";
import type { ExchangeResult } from "./index.ts";

export const executeLighter = async (
  metadata: TradingMetadata,
): Promise<ExchangeResult> => {
  console.log(
    `[lighter] Placing ${metadata.type} order: ${metadata.qty} ${metadata.symbol}`,
  );

  // Replace body with real Lighter exchange API call when credentials are available.
  return {
    success: true,
    orderId: `lt-${Date.now()}`,
    message: `Lighter ${metadata.type} ${metadata.qty} ${metadata.symbol} placed (stub)`,
  };
};
