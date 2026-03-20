import type { TradingMetadata, LighterTradingMetadata } from "common";
import { SignerClient } from "lighter-sdk-ts/signer";
import type { ExchangeResult } from "./index.ts";

const MARKET_INDEX: Record<string, number> = {
  BTC: 0,
  ETH: 1,
  SOL: 2,
};

const MAX_MARKET_PRICE = 999_999_999;

const clientCache = new Map<string, Promise<SignerClient>>();

const getCacheKey = (meta: LighterTradingMetadata): string =>
  `${meta.lighterUrl}:${meta.lighterAccountIndex}:${meta.lighterApiKeyIndex}`;

const getClient = (meta: LighterTradingMetadata): Promise<SignerClient> => {
  const key = getCacheKey(meta);
  const cached = clientCache.get(key);
  if (cached) {
    return cached;
  }

  const promise = SignerClient.create({
    url: meta.lighterUrl,
    privateKey: meta.lighterPrivateKey,
    apiKeyIndex: meta.lighterApiKeyIndex,
    accountIndex: meta.lighterAccountIndex,
  });

  promise.catch(() => {
    clientCache.delete(key);
  });

  clientCache.set(key, promise);
  return promise;
};

export const executeLighter = async (
  metadata: TradingMetadata,
): Promise<ExchangeResult> => {
  const meta = metadata as LighterTradingMetadata;
  const { type, qty, symbol } = meta;

  if (!meta.lighterPrivateKey || meta.lighterAccountIndex == null || meta.lighterApiKeyIndex == null) {
    return {
      success: false,
      message: "Lighter: missing API credentials. Configure them on the Lighter node.",
    };
  }

  if (!meta.lighterUrl) {
    return {
      success: false,
      message: "Lighter: missing API URL. Configure it on the Lighter node.",
    };
  }

  console.log(
    `[lighter] Placing ${type} order: ${qty} ${symbol}`,
  );

  const marketIndex = MARKET_INDEX[symbol];
  if (marketIndex === undefined) {
    return {
      success: false,
      message: `Lighter: unsupported symbol "${symbol}". Supported: ${Object.keys(MARKET_INDEX).join(", ")}`,
    };
  }

  const isAsk = type === "SHORT";

  try {
    const client = await getClient(meta);

    const result = await client.createOrder({
      marketIndex,
      clientOrderIndex: Date.now() % 2_147_483_647,
      baseAmount: qty,
      price: isAsk ? 1 : MAX_MARKET_PRICE,
      isAsk,
      orderType: SignerClient.ORDER_TYPE_MARKET,
      timeInForce: SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
      reduceOnly: 0,
      triggerPrice: SignerClient.NIL_TRIGGER_PRICE,
      orderExpiry: SignerClient.DEFAULT_IOC_EXPIRY,
    });

    const txHash = result.apiResponse?.txHash ?? result.txInfo ?? "unknown";

    return {
      success: true,
      orderId: String(txHash),
      message: `Lighter ${type} ${qty} ${symbol} executed (tx: ${txHash})`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Lighter SDK error";
    return {
      success: false,
      message: `Lighter order failed: ${errorMessage}`,
    };
  }
};
