export interface Card {
  id: string;
  headline: string;
  summary: string;
  bullets: string[];
  category: 'top' | 'local' | 'weather' | 'markets' | 'sports' | 'org';
  timestamp: string;
  citations: string[];
}

export interface NewsItem {
  title: string;
  summary?: string;
  link: string;
  source: string;
  category: string;
  publishedAt?: string;
}

export interface Source {
  name: string;
  url: string;
  category: 'top' | 'local' | 'weather' | 'markets' | 'sports' | 'org';
}
