import type { TradingMetadata } from "common";
import { executeHyperliquid } from "./hyperliquid.ts";
import { executeBackpack } from "./backpack.ts";
import { executeLighter } from "./lighter.ts";

export type ExchangeResult = {
  success: boolean;
  orderId?: string;
  message: string;
};

export type ExchangeAdapter = (
  metadata: TradingMetadata,
) => Promise<ExchangeResult>;

const exchangeAdapters: Record<string, ExchangeAdapter> = {
  Hyperliquid: executeHyperliquid,
  Backpack: executeBackpack,
  Lighter: executeLighter,
};

export const getExchangeAdapter = (
  nodeType: string,
): ExchangeAdapter | null => {
  return exchangeAdapters[nodeType] ?? null;
};
