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
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface CacheData {
  data: TickerItem[];
  timestamp: number;
}

// Helper function to get cached data
function getCachedData(): TickerItem[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 10 minutes)
    if (now - cacheData.timestamp < CACHE_DURATION) {
      console.log('📈 Using cached market data (fresh)');
      return cacheData.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    console.log('📈 Cache expired, fetching fresh data');
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

// Helper function to set cached data
function setCachedData(data: TickerItem[]): void {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('💾 Market data cached');
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

// Helper function to clear cached data (useful for development)
export function clearMarketDataCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Market data cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export async function fetchMarketData(): Promise<TickerItem[]> {
  // First, check if we have valid cached data
  const cachedData = getCachedData();
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log('🌐 Fetching fresh market data from Yahoo Finance...');

    // Yahoo Finance API - No API key required!
    // This is a public endpoint that Yahoo provides for quote data
    const symbols = DEMO_SYMBOLS.join(',');
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Yahoo's response format to our TickerItem interface
    const marketData = data.quoteResponse.result.map((item: any) => ({
      symbol: item.symbol,
      name: getCompanyName(item.symbol),
      price: item.regularMarketPrice || 0,
      change: item.regularMarketChange || 0,
      changePercent: item.regularMarketChangePercent || 0,
    }));

    // Cache the fresh data for 10 minutes
    setCachedData(marketData);

    console.log('✅ Fresh market data fetched and cached');
    return marketData;

  } catch (error) {
    console.error('❌ Market data fetch failed:', error);

    // Fallback to simulated data if API fails
    console.log('🔄 Falling back to simulated market data');
    await new Promise(resolve => setTimeout(resolve, 200));

    const fallbackData = DEMO_SYMBOLS.map((symbol, index) => ({
      symbol,
      name: getCompanyName(symbol),
      price: 100 + Math.random() * 800,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 8,
    }));

    return fallbackData;
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
