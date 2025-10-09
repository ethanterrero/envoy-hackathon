# Market Data API Integration Guide

This guide shows how to integrate real financial data APIs with your ticker bar component.

## Quick Start - Yahoo Finance (No API Key Required)

**Pros**: Free, no API key needed, reliable
**Cons**: Rate limits, less real-time than paid options

```typescript
// In src/util/marketData.ts, uncomment and modify:
export async function fetchMarketData(): Promise<TickerItem[]> {
  const symbols = ["SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META"];
  const symbolString = symbols.join(',');

  const response = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolString}`
  );

  if (!response.ok) {
    throw new Error(`Yahoo API error: ${response.status}`);
  }

  const data = await response.json();

  return data.quoteResponse.result.map((item: any) => ({
    symbol: item.symbol,
    name: getCompanyName(item.symbol),
    price: item.regularMarketPrice || 0,
    change: item.regularMarketChange || 0,
    changePercent: item.regularMarketChangePercent || 0,
  }));
}
```

## Option 1: Alpha Vantage (Recommended for Production)

**Pricing**: Free tier (5 calls/min, 100/day), Paid plans start at $50/month
**Real-time**: 1-2 minute delay for free tier
**Setup**:

1. Sign up at [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Get your free API key
3. Add to your `.env` file:
   ```bash
   VITE_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

```typescript
// In src/util/marketData.ts:
export async function fetchMarketData(): Promise<TickerItem[]> {
  const symbols = ["SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META"];
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }

  // Fetch multiple symbols (Alpha Vantage allows batch quotes)
  const promises = symbols.slice(0, 5).map(async (symbol) => {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data['Global Quote'];

    return {
      symbol: quote['01. symbol'],
      name: getCompanyName(quote['01. symbol']),
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
    };
  });

  return Promise.all(promises);
}
```

## Option 2: Financial Modeling Prep

**Pricing**: Free tier (250 calls/day), Paid plans start at $19/month
**Real-time**: Real-time data available
**Setup**:

1. Sign up at [financialmodelingprep.com](https://financialmodelingprep.com/)
2. Get your API key
3. Add to `.env`:
   ```bash
   VITE_FMP_API_KEY=your_api_key_here
   ```

```typescript
// In src/util/marketData.ts:
export async function fetchMarketData(): Promise<TickerItem[]> {
  const symbols = ["SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META"];
  const apiKey = import.meta.env.VITE_FMP_API_KEY;

  if (!apiKey) {
    throw new Error('FMP API key not configured');
  }

  const symbolString = symbols.join(',');
  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data = await response.json();

  return data.map((item: any) => ({
    symbol: item.symbol,
    name: getCompanyName(item.symbol),
    price: item.price || 0,
    change: item.change || 0,
    changePercent: item.changesPercentage || 0,
  }));
}
```

## Option 3: Polygon.io

**Pricing**: Free tier (5 calls/min), Paid plans start at $29/month
**Real-time**: Real-time data available
**Setup**:

1. Sign up at [polygon.io](https://polygon.io/)
2. Get your API key
3. Add to `.env`:
   ```bash
   VITE_POLYGON_API_KEY=your_api_key_here
   ```

```typescript
// In src/util/marketData.ts:
export async function fetchMarketData(): Promise<TickerItem[]> {
  const symbols = ["SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META"];
  const apiKey = import.meta.env.VITE_POLYGON_API_KEY;

  if (!apiKey) {
    throw new Error('Polygon API key not configured');
  }

  // Get previous close data (most recent available)
  const response = await fetch(
    `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${new Date().toISOString().split('T')[0]}?adjusted=true&apiKey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.status}`);
  }

  const data = await response.json();

  // Filter for our symbols and calculate changes
  return symbols.map(symbol => {
    const stockData = data.results.find((item: any) => item.T === symbol);
    if (!stockData) {
      return {
        symbol,
        name: getCompanyName(symbol),
        price: 0,
        change: 0,
        changePercent: 0,
      };
    }

    const price = stockData.c; // Close price
    const prevClose = stockData.PC || price; // Previous close
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      symbol,
      name: getCompanyName(symbol),
      price,
      change,
      changePercent,
    };
  });
}
```

## Environment Setup

Create a `.env` file in your project root:

```bash
# Choose ONE of these APIs:

# For Yahoo Finance (no key needed)
# VITE_YAHOO_FINANCE_KEY=free

# For Alpha Vantage
VITE_ALPHA_VANTAGE_API_KEY=your_key_here

# For Financial Modeling Prep
# VITE_FMP_API_KEY=your_key_here

# For Polygon.io
# VITE_POLYGON_API_KEY=your_key_here
```

## Error Handling & Rate Limits

```typescript
export async function fetchMarketData(): Promise<TickerItem[]> {
  try {
    const data = await yourApiCall();

    // Validate data structure
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid API response format');
    }

    return data;
  } catch (error) {
    console.error('Market data fetch failed:', error);

    // Return cached data or fallback
    return getCachedData() || getFallbackData();
  }
}
```

## Recommendations

**For Development/Testing**: Yahoo Finance (free, no setup required)

**For Production**:
- **Budget-conscious**: Alpha Vantage ($50/month for 500 calls/min)
- **Real-time needs**: Polygon.io (real-time data available)
- **Feature-rich**: Financial Modeling Prep (good balance of price/features)

## Next Steps

1. Choose your preferred API from the options above
2. Sign up for an account and get your API key
3. Add the API key to your `.env` file
4. Uncomment the corresponding code in `src/util/marketData.ts`
5. Test the integration with your ticker bar

The ticker will automatically update every 30 seconds with fresh market data!
