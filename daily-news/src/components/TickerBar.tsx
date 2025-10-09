import { useState, useEffect } from "react";
import { fetchMarketData, getDefaultTickers } from "../util/marketData";
import type { TickerItem } from "../util/marketData";

export default function TickerBar() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(getDefaultTickers());
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

  const TickerItem = ({ ticker, index, isDuplicate = false }: { ticker: TickerItem; index: number; isDuplicate?: boolean }) => (
    <div key={`${ticker.symbol}-${isDuplicate ? 'dup-' : ''}${index}`} className="flex items-center gap-3 text-sm">
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
  );

  return (
    <div className="bg-slate-900 text-white py-2 overflow-hidden">
      <div className="flex animate-scroll-left">
        <div className="flex items-center gap-8 px-4 whitespace-nowrap">
          {tickerData.map((ticker, index) => (
            <TickerItem key={`${ticker.symbol}-${index}`} ticker={ticker} index={index} />
          ))}
        </div>

        {/* Duplicate for seamless scroll */}
        <div className="flex items-center gap-8 px-4 whitespace-nowrap">
          {tickerData.map((ticker, index) => (
            <TickerItem key={`${ticker.symbol}-dup-${index}`} ticker={ticker} index={index} isDuplicate />
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
