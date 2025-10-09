import { useState, useEffect } from "react";
import { fetchMarketData } from "../util/marketData";
import type { TickerItem } from "../util/marketData";

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "SPY", name: "S&P 500 ETF", price: 425.50, change: 2.15, changePercent: 0.51 },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", price: 385.20, change: -1.80, changePercent: -0.47 },
  { symbol: "AAPL", name: "Apple Inc.", price: 175.25, change: 3.45, changePercent: 2.01 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85, change: -2.15, changePercent: -0.56 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.65, change: 1.85, changePercent: 1.31 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: -5.25, changePercent: -2.07 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.30, change: 12.45, changePercent: 1.44 },
  { symbol: "META", name: "Meta Platforms", price: 485.75, change: 6.90, changePercent: 1.44 },
];

export default function TickerBar() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(DEFAULT_TICKERS);
  const [isLoading, setIsLoading] = useState(false);

  const refreshMarketData = async () => {
    setIsLoading(true);
    try {
      const freshData = await fetchMarketData();
      setTickerData(freshData);
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      // Keep existing data on error to prevent blank ticker
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    refreshMarketData();

    // Update every 30 seconds (but API calls will be cached for 10 minutes)
    const interval = setInterval(refreshMarketData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-white py-2 overflow-hidden">
      <div className="flex animate-scroll-left">
        <div className="flex items-center gap-8 px-4 whitespace-nowrap">
          {tickerData.map((ticker, index) => (
            <div key={`${ticker.symbol}-${index}`} className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-white">{ticker.symbol}</span>
              <span className="text-slate-300">{ticker.price.toFixed(2)}</span>
              <span
                className={`font-medium ${
                  ticker.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {ticker.change >= 0 ? '+' : ''}
                {ticker.change.toFixed(2)}
              </span>
              <span
                className={`font-medium ${
                  ticker.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ({ticker.changePercent >= 0 ? '+' : ''}
                {ticker.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>

        {/* Duplicate for seamless scroll */}
        <div className="flex items-center gap-8 px-4 whitespace-nowrap">
          {tickerData.map((ticker, index) => (
            <div key={`${ticker.symbol}-dup-${index}`} className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-white">{ticker.symbol}</span>
              <span className="text-slate-300">{ticker.price.toFixed(2)}</span>
              <span
                className={`font-medium ${
                  ticker.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {ticker.change >= 0 ? '+' : ''}
                {ticker.change.toFixed(2)}
              </span>
              <span
                className={`font-medium ${
                  ticker.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ({ticker.changePercent >= 0 ? '+' : ''}
                {ticker.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
