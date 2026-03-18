import type { TradingMetadata } from "common";
import type { ExchangeResult } from "./index.ts";

export const executeBackpack = async (
  metadata: TradingMetadata,
): Promise<ExchangeResult> => {
  console.log(
    `[backpack] Placing ${metadata.type} order: ${metadata.qty} ${metadata.symbol}`,
  );

  // Replace body with real Backpack exchange API call when credentials are available.
  return {
    success: true,
    orderId: `bp-${Date.now()}`,
    message: `Backpack ${metadata.type} ${metadata.qty} ${metadata.symbol} placed (stub)`,
  };
};
