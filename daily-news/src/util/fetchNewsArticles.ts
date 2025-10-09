// News API integration for fetching real-time articles
// Docs: https://newsapi.org/docs

import { getCachedData, setCachedData, clearCachedData } from './cache';

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string; // ISO 8601 timestamp
  content: string;
}

export interface NewsByCategory {
  top: NewsArticle[];
  tech: NewsArticle[];
  sports: NewsArticle[];
  markets: NewsArticle[];
  local: NewsArticle[];
  weather: NewsArticle[];
}

// Cache configuration - cache until 8am next day (same as market data)
const CACHE_KEY = 'envoy_news_cache';
const CACHE_OPTIONS = { key: CACHE_KEY, refreshHour: 8 };

// Helper function to clear cached data (useful for development)
export function clearNewsCache(): void {
  clearCachedData(CACHE_OPTIONS);
}

// Fetch articles from NewsAPI for a specific category
async function fetchArticlesByCategory(
  apiKey: string,
  category: string,
  query?: string
): Promise<NewsArticle[]> {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const fromDate = yesterday.toISOString().split('T')[0];
    
    let url: string;
    
    // For specific queries (like local news or weather)
    if (query) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDate}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${apiKey}`;
    } else {
      // For standard categories (business, technology, sports)
      url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=5&apiKey=${apiKey}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NewsAPI error for ${category}: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${data.status}`);
    }

    return data.articles || [];
  } catch (error) {
    console.error(`Failed to fetch ${category} news:`, error);
    return [];
  }
}

// Main function to fetch all news articles by category
export async function fetchNewsArticles(): Promise<NewsByCategory> {
  // First, check if we have valid cached data
  const cachedData = getCachedData<NewsByCategory>(CACHE_OPTIONS);
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log('🌐 Fetching fresh news from NewsAPI...');

    const apiKey = import.meta.env.VITE_NEWSAPI_KEY;

    if (!apiKey) {
      throw new Error('NewsAPI key not configured. Please add VITE_NEWSAPI_KEY to your .env file');
    }

    // Fetch news for each category in parallel (excluding political content)
    const [topNews, techNews, sportsNews, marketsNews, localNews, weatherNews] = await Promise.all([
      fetchArticlesByCategory(apiKey, '', 'workplace trends NOT politics NOT election NOT government'), // Top stories (non-political)
      fetchArticlesByCategory(apiKey, 'technology', 'AI OR software OR innovation NOT politics'), // Tech
      fetchArticlesByCategory(apiKey, 'sports'), // Sports
      fetchArticlesByCategory(apiKey, 'business', 'markets OR economy OR companies NOT politics'), // Markets/Business
      fetchArticlesByCategory(apiKey, '', 'San Francisco Bay Area workplace OR commute NOT politics'), // Local (using query)
      fetchArticlesByCategory(apiKey, '', 'weather forecast USA travel'), // Weather (using query)
    ]);

    const newsByCategory: NewsByCategory = {
      top: topNews,
      tech: techNews,
      sports: sportsNews,
      markets: marketsNews,
      local: localNews,
      weather: weatherNews,
    };

    // Cache the fresh data until tomorrow at 8am
    setCachedData(newsByCategory, CACHE_OPTIONS);

    console.log('✅ Fresh news data fetched and cached');
    return newsByCategory;

  } catch (error) {
    console.error('❌ News fetch failed:', error);

    // Try to return cached data if available (even if expired)
    const cachedData = getCachedData<NewsByCategory>(CACHE_OPTIONS);
    if (cachedData) {
      console.log('🔄 Using stale cached news due to API failure');
      return cachedData;
    }

    // Return empty structure if no cache available
    console.error('🚨 No news data available - both API and cache failed');
    return {
      top: [],
      tech: [],
      sports: [],
      markets: [],
      local: [],
      weather: [],
    };
  }
}

// Helper function to format articles for LLM consumption
export function formatArticlesForLLM(articles: NewsArticle[]): string {
  return articles
    .slice(0, 3) // Take top 3 articles per category
    .map((article, idx) => {
      return `
Article ${idx + 1}:
Title: ${article.title}
Source: ${article.source.name}
Published: ${article.publishedAt}
URL: ${article.url}
Description: ${article.description || 'N/A'}
Content: ${article.content ? article.content.substring(0, 500) : 'N/A'}
`.trim();
    })
    .join('\n\n---\n\n');
}

