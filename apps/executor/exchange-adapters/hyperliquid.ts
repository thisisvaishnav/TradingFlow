import type { TradingMetadata } from "common";
import type { ExchangeResult } from "./index.ts";

export const executeHyperliquid = async (
  metadata: TradingMetadata,
): Promise<ExchangeResult> => {
  console.log(
    `[hyperliquid] Placing ${metadata.type} order: ${metadata.qty} ${metadata.symbol}`,
  );

  // Replace body with real Hyperliquid SDK call when API key is available.
  // e.g. const client = new HyperliquidClient(process.env.HYPERLIQUID_API_KEY);
  return {
    success: true,
    orderId: `hl-${Date.now()}`,
    message: `Hyperliquid ${metadata.type} ${metadata.qty} ${metadata.symbol} placed (stub)`,
  };
};
