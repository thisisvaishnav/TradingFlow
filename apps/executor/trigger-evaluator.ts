import type { PriceTriggerMetadata, TimerNodeMetadata } from "common";

type TriggerState = {
  lastFiredAt: number;
  priceConditionMet: boolean;
};

const triggerStates = new Map<string, TriggerState>();

const ASSET_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

let cachedPrices: Record<string, number> = {};
let lastPriceFetchAt = 0;
const PRICE_CACHE_TTL_MS = 15_000;

const fetchCurrentPrices = async (): Promise<Record<string, number>> => {
  const now = Date.now();
  if (
    now - lastPriceFetchAt < PRICE_CACHE_TTL_MS &&
    Object.keys(cachedPrices).length > 0
  ) {
    return cachedPrices;
  }

  try {
    const ids = Object.values(ASSET_TO_COINGECKO_ID).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    );

    if (!response.ok) {
      console.warn(
        `[trigger-evaluator] Price API returned ${response.status}`,
      );
      return cachedPrices;
    }

    const data = (await response.json()) as Record<
      string,
      { usd?: number }
    >;
    const prices: Record<string, number> = {};

    for (const [symbol, coingeckoId] of Object.entries(ASSET_TO_COINGECKO_ID)) {
      const entry = data[coingeckoId];
      if (entry && typeof entry.usd === "number") {
        prices[symbol] = entry.usd;
      }
    }

    cachedPrices = prices;
    lastPriceFetchAt = now;
    return prices;
  } catch (error) {
    console.warn("[trigger-evaluator] Price fetch error:", error);
    return cachedPrices;
  }
};

/**
 * Fires once when the current price reaches or exceeds the target price.
 * Resets when price drops back below so it can fire again on the next cross.
 */
const evaluatePriceTrigger = async (
  triggerId: string,
  metadata: PriceTriggerMetadata,
): Promise<boolean> => {
  const prices = await fetchCurrentPrices();
  const currentPrice = prices[metadata.asset.toUpperCase()];

  if (currentPrice === undefined) {
    return false;
  }

  const state = triggerStates.get(triggerId);
  const conditionMet = currentPrice >= metadata.price;

  if (conditionMet && !state?.priceConditionMet) {
    triggerStates.set(triggerId, {
      lastFiredAt: Date.now(),
      priceConditionMet: true,
    });
    console.log(
      `[trigger-evaluator] Price trigger fired: ${metadata.asset} $${currentPrice} >= $${metadata.price}`,
    );
    return true;
  }

  if (!conditionMet && state?.priceConditionMet) {
    triggerStates.set(triggerId, {
      lastFiredAt: state.lastFiredAt,
      priceConditionMet: false,
    });
  }

  return false;
};

/**
 * Fires every `metadata.time` seconds since the last fire.
 * First evaluation always fires immediately.
 */
const evaluateTimerTrigger = (
  triggerId: string,
  metadata: TimerNodeMetadata,
): boolean => {
  const now = Date.now();
  const state = triggerStates.get(triggerId);
  const intervalMs = metadata.time * 1000;

  if (!state || now - state.lastFiredAt >= intervalMs) {
    triggerStates.set(triggerId, {
      lastFiredAt: now,
      priceConditionMet: false,
    });
    console.log(
      `[trigger-evaluator] Timer trigger fired: interval ${metadata.time}s`,
    );
    return true;
  }

  return false;
};

const resetTriggerState = (triggerId: string) => {
  triggerStates.delete(triggerId);
};

export {
  evaluatePriceTrigger,
  evaluateTimerTrigger,
  fetchCurrentPrices,
  resetTriggerState,
};
