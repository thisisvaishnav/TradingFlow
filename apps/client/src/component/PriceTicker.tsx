import { useEffect, useState, useRef } from "react";

interface CoinData {
  symbol: string;
  label: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: number;
}

const COINS = [
  { symbol: "BTCUSDT", label: "BTC" },
  { symbol: "ETHUSDT", label: "ETH" },
  { symbol: "SOLUSDT", label: "SOL" },
] as const;

const BINANCE_URL = "https://data-api.binance.vision/api/v3/ticker/24hr";

const formatPrice = (price: number): string => {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const formatVolume = (vol: number): string => {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toFixed(0);
};

export const PriceTicker = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = async () => {
    try {
      const promises = COINS.map(async (coin) => {
        const res = await fetch(`${BINANCE_URL}?symbol=${coin.symbol}`);
        const data = await res.json();
        return {
          symbol: coin.symbol,
          label: coin.label,
          price: parseFloat(data.lastPrice),
          change: parseFloat(data.priceChangePercent),
          high: parseFloat(data.highPrice),
          low: parseFloat(data.lowPrice),
          volume: parseFloat(data.quoteVolume),
        } as CoinData;
      });
      const results = await Promise.all(promises);
      setCoins(results);
      setIsLoading(false);
    } catch (err) {
      console.error("[PriceTicker] Fetch error:", err);
    }
  };

  useEffect(() => {
    void fetchPrices();
    intervalRef.current = setInterval(() => void fetchPrices(), 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="price-ticker">
        <div className="price-ticker__inner">
          <span className="price-ticker__loading">Loading prices…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="price-ticker">
      <div className="price-ticker__inner">
        <span className="price-ticker__label">LIVE</span>
        <span className="price-ticker__dot" />
        {coins.map((coin) => {
          const isPositive = coin.change >= 0;
          return (
            <div key={coin.symbol} className="price-ticker__coin">
              <span className="price-ticker__coin-name">{coin.label}</span>
              <span className="price-ticker__coin-price">${formatPrice(coin.price)}</span>
              <span className={`price-ticker__coin-change ${isPositive ? "price-ticker__coin-change--up" : "price-ticker__coin-change--down"}`}>
                {isPositive ? "▲" : "▼"} {Math.abs(coin.change).toFixed(2)}%
              </span>
              <span className="price-ticker__coin-detail" title={`H: $${formatPrice(coin.high)} / L: $${formatPrice(coin.low)}`}>
                Vol ${formatVolume(coin.volume)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
