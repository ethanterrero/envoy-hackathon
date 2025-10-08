import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_SOURCES } from './sources';
import { dedupe } from './dedupe';
import type { Card, NewsItem } from './types';

const client = new Anthropic({ 
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function fetchDailyNews(): Promise<Card[]> {
  // For now, let's use mock data to test the UI
  // In production, you'd want to set up a backend to handle RSS fetching
  const mockItems: NewsItem[] = [
    {
      title: "Breaking: Major Tech Company Announces New AI Initiative",
      summary: "A leading technology company has unveiled a comprehensive artificial intelligence strategy that could reshape the industry.",
      link: "https://example.com/tech-ai-initiative",
      source: "Tech News",
      category: "top",
      publishedAt: new Date().toISOString()
    },
    {
      title: "Global Climate Summit Reaches Historic Agreement",
      summary: "World leaders have reached a landmark agreement on climate action, setting ambitious new targets for carbon reduction.",
      link: "https://example.com/climate-summit",
      source: "Global News",
      category: "top",
      publishedAt: new Date().toISOString()
    },
    {
      title: "Stock Markets Show Strong Performance This Week",
      summary: "Major indices have posted significant gains as investor confidence continues to grow in key sectors.",
      link: "https://example.com/market-performance",
      source: "Financial Times",
      category: "markets",
      publishedAt: new Date().toISOString()
    },
    {
      title: "New Medical Breakthrough in Cancer Treatment",
      summary: "Researchers have announced promising results from a new cancer treatment approach that shows improved patient outcomes.",
      link: "https://example.com/cancer-treatment",
      source: "Medical News",
      category: "top",
      publishedAt: new Date().toISOString()
    },
    {
      title: "Sports Championship Finals Set for This Weekend",
      summary: "The highly anticipated championship finals are scheduled for this weekend, with top teams competing for the title.",
      link: "https://example.com/sports-finals",
      source: "Sports Central",
      category: "sports",
      publishedAt: new Date().toISOString()
    }
  ];
  
  // 2. Remove duplicates
  const unique = dedupe(mockItems);
  
  // 3. Summarize with Claude
  const cards = await summarizeToCards(unique);
  
  return cards;
}

async function fetchRSS(url: string): Promise<NewsItem[]> {
  // Use a different CORS proxy service
  const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
  
  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const items = doc.querySelectorAll('item');
    return Array.from(items).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      summary: item.querySelector('description')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      source: '',
      category: '',
      publishedAt: item.querySelector('pubDate')?.textContent || ''
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${url}:`, error);
    // Return mock data for testing
    return [{
      title: `Sample news from ${url}`,
      summary: 'This is a sample news item for testing purposes.',
      link: url,
      source: 'Sample Source',
      category: 'top',
      publishedAt: new Date().toISOString()
    }];
  }
}

async function summarizeToCards(items: NewsItem[]): Promise<Card[]> {
  if (items.length === 0) return [];
  
  const system = `You are a news briefing writer for digital signage.

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations.

Each card object must have:
- id: unique string
- headline: string (max 90 characters)
- summary: string (max 180 characters)  
- bullets: array of 2-3 strings (max 16 words each)
- category: one of 'top'|'local'|'weather'|'markets'|'sports'|'org'
- timestamp: ISO 8601 string
- citations: array of source URLs

Guidelines:
- Group similar stories into single cards
- Create 8-12 cards total
- Use only facts present in the source items
- Keep language clear and concise
- Include all relevant source URLs in citations`;

  const userPrompt = `Analyze these ${items.length} news items and create briefing cards:

${JSON.stringify({ items }, null, 2)}

Return a JSON array of card objects.`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });
    
    const text = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '[]';
    
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleaned);
    
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array');
      return [];
    }
    
    return parsed.map((card, idx) => ({
      ...card,
      id: card.id || `card-${Date.now()}-${idx}`,
      timestamp: card.timestamp || new Date().toISOString()
    }));
    
  } catch (error) {
    console.error('Summarization error:', error);
    return [];
  }
}
