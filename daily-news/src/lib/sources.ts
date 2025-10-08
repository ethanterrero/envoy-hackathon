import type { Source } from './types';

export const DEFAULT_SOURCES: Source[] = [
  { 
    name: 'Reuters Top', 
    url: 'https://www.reuters.com/rssFeed/topNews', 
    category: 'top' 
  },
  { 
    name: 'AP Top', 
    url: 'https://apnews.com/hub/ap-top-news?utm_source=ap_rss&utm_medium=rss&utm_campaign=ap_rss', 
    category: 'top' 
  },
  { 
    name: 'BBC World', 
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml', 
    category: 'top' 
  },
  { 
    name: 'NPR News', 
    url: 'https://feeds.npr.org/1001/rss.xml', 
    category: 'top' 
  },
  { 
    name: 'CNN Top Stories', 
    url: 'http://rss.cnn.com/rss/edition.rss', 
    category: 'top' 
  },
];
