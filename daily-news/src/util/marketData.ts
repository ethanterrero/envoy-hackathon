import { getCachedData, setCachedData, clearCachedData } from './cache';

// For demo purposes - replace with real API integration
const DEMO_SYMBOLS = [
  "SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META"
];

// Shared type definitions
export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Cache configuration
const CACHE_KEY = 'envoy_market_data_cache';
const CACHE_OPTIONS = { key: CACHE_KEY, refreshHour: 8 };

// Helper function to clear cached data (useful for development)
export function clearMarketDataCache(): void {
  clearCachedData(CACHE_OPTIONS);
}

export async function fetchMarketData(): Promise<TickerItem[]> {
  // First, check if we have valid cached data
  const cachedData = getCachedData<TickerItem[]>(CACHE_OPTIONS);
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log('🌐 Fetching fresh market data from Alpha Vantage...');

    // Alpha Vantage API - requires API key
    const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured. Please add VITE_ALPHA_VANTAGE_API_KEY to your .env file');
    }

    // Fetch data for each symbol individually (Alpha Vantage free tier: 5 calls/min, 100/day)
    const marketDataPromises = DEMO_SYMBOLS.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
          {
            mode: 'cors'
          }
        );

        if (!response.ok) {
          throw new Error(`Alpha Vantage API error for ${symbol}: ${response.status}`);
        }

        const data = await response.json();

        // Alpha Vantage returns data in 'Global Quote' field
        const quote = data['Global Quote'];

        if (!quote) {
          console.warn(`No quote data found for ${symbol}`);
          return null;
        }

        return {
          symbol: quote['01. symbol'],
          name: getCompanyName(quote['01. symbol']),
          price: parseFloat(quote['05. price']) || 0,
          change: parseFloat(quote['09. change']) || 0,
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
        };
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        return null;
      }
    });

    // Wait for all API calls to complete
    const results = await Promise.all(marketDataPromises);

    // Filter out failed requests and create market data array
    const marketData = results.filter((result): result is TickerItem => result !== null);

    if (marketData.length === 0) {
      throw new Error('All API requests failed');
    }

    // Cache the fresh data until tomorrow at 8am
    setCachedData(marketData, CACHE_OPTIONS);

    console.log(`✅ Fresh market data fetched for ${marketData.length}/${DEMO_SYMBOLS.length} symbols`);
    return marketData;

  } catch (error) {
    console.error('❌ Market data fetch failed:', error);

    // Try to return cached data if available (even if expired)
    const cachedData = getCachedData<TickerItem[]>(CACHE_OPTIONS);
    if (cachedData && cachedData.length > 0) {
      console.log('🔄 Using cached market data due to API failure');
      return cachedData;
    }

    // If no cached data either, throw error to show no data available
    console.error('🚨 No market data available - both API and cache failed');
    throw new Error('Unable to fetch market data. Please check your Alpha Vantage API key and internet connection.');
  }
}

function getCompanyName(symbol: string): string {
  const companyNames: Record<string, string> = {
    "SPY": "S&P 500 ETF",
    "QQQ": "Nasdaq 100 ETF",
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp.",
    "GOOGL": "Alphabet Inc.",
    "TSLA": "Tesla Inc.",
    "NVDA": "NVIDIA Corp.",
    "META": "Meta Platforms",
  };
  return companyNames[symbol] || symbol;
}

// Default ticker data for initial display (fallback when API fails)
export function getDefaultTickers(): TickerItem[] {
  return DEMO_SYMBOLS.map(symbol => ({
    symbol,
    name: getCompanyName(symbol),
    price: 0, // Will be updated by API
    change: 0,
    changePercent: 0,
  }));
}
