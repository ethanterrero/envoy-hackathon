import OpenAI from "openai";

export interface Card {
  id: string;
  headline: string;
  summary: string;
  bullets: string[];
  category: string;
  timestamp: string;
  citations: string[];
}

// helper: quick fetch with timeout
async function get(url: string, ms = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    return txt;
  } finally {
    clearTimeout(id);
  }
}

// helper: extract actual headlines from RSS-ish text
function extractItems(raw: string) {
  const lines = raw.split("\n").map(s => s.trim()).filter(Boolean);
  
  // Look for lines that are likely headlines (medium length, not URLs, not metadata)
  const headlines = lines.filter(line => {
    const len = line.length;
    const hasUrl = line.includes('http://') || line.includes('https://');
    const hasDate = /\d{4}-\d{2}-\d{2}/.test(line);
    const isMetadata = line.startsWith('Title:') || line.startsWith('Link:') || line.startsWith('Published:');
    const tooShort = len < 25;
    const tooLong = len > 200;
    
    return !hasUrl && !hasDate && !isMetadata && !tooShort && !tooLong;
  });
  
  // Deduplicate and limit
  const unique = Array.from(new Set(headlines));
  return unique.map((t) => ({ title: t }));
}

// ✅ replace your fetchDailyNews with this:
export async function fetchDailyNews(): Promise<Card[]> {
  try {
    const startTime = Date.now();
    console.log("📰 Starting news fetch...");
    
    // 📰 Diverse news sources across different categories
    const FEEDS = [
      { url: "https://r.jina.ai/http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC News", category: "top" },
      { url: "https://r.jina.ai/https://www.wired.com/feed/rss", source: "Wired", category: "tech" },
      { url: "https://r.jina.ai/https://www.espn.com/espn/rss/news", source: "ESPN", category: "sports" },
      { url: "https://r.jina.ai/https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", category: "markets" },
      { url: "https://r.jina.ai/https://www.theverge.com/rss/index.xml", source: "The Verge", category: "tech" },
      { url: "https://r.jina.ai/https://news.ycombinator.com/rss", source: "Hacker News", category: "tech" },
    ];

    const feedStart = Date.now();
    console.log("Fetching RSS feeds from", FEEDS.length, "sources...");
    const results = await Promise.allSettled(FEEDS.map(f => 
      get(f.url, 4000).then(text => ({ text, source: f.source, category: f.category }))
    ));
    
    const feedData = results
      .filter(r => r.status === "fulfilled")
      .map((r: any) => r.value);
    
    console.log(`✅ Fetched ${feedData.length} feeds in ${Date.now() - feedStart}ms`);
    
    // Extract items per source to maintain source attribution
    const itemsByCategory: Record<string, Array<{title: string, source: string, category: string}>> = {
      top: [],
      tech: [],
      sports: [],
      markets: [],
      local: [],
      weather: []
    };
    
    for (const feed of feedData) {
      const items = extractItems(feed.text).slice(0, 6); // Limit per source to balance
      items.forEach(item => {
        const categoryItem = {
          title: item.title,
          source: feed.source,
          category: feed.category
        };
        if (itemsByCategory[feed.category]) {
          itemsByCategory[feed.category].push(categoryItem);
        }
      });
    }
    
    const allItems = Object.values(itemsByCategory).flat();
    console.log("Extracted items by category:", {
      top: itemsByCategory.top.length,
      tech: itemsByCategory.tech.length,
      sports: itemsByCategory.sports.length,
      markets: itemsByCategory.markets.length,
    });
    
    const haveSources = allItems.length > 0;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log("OpenAI API key exists:", !!apiKey);
    
    const client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // ok for hackathon
    });

    const system = `You are a news curator creating concise briefing cards from ACTUAL news headlines.

    CRITICAL RULES:
    1. Each card must be about a SPECIFIC, REAL news story from the provided headlines
    2. DO NOT write generic descriptions of news sources
    3. MANDATORY: Use EXACTLY 6 DIFFERENT categories - one card per category!
    - Card 1: 'top' (world news, politics)
    - Card 2: 'tech' (technology, AI, gadgets)
    - Card 3: 'sports' (athletics, teams, games)
    - Card 4: 'markets' (finance, economy, business)
    - Card 5: 'tech' or 'top' (alternate category)
    - Card 6: any remaining category
    4. Each card MUST use a DIFFERENT source
    5. Pick the BEST matching headline from each category

    Card format:
    - id: string
    - headline: punchy, specific (<= 80 chars) about THE ACTUAL STORY
    - summary: 2-3 sentences (200-350 chars) with SPECIFIC details, names, numbers
    - bullets: 2-3 key facts
    - category: MUST follow the distribution above
    - timestamp: ISO 8601
    - citations: array with the source name

    BAD: "BBC News Coverage - BBC provides comprehensive coverage..."
    GOOD: "Apple Unveils iPhone 16 with AI Features - Apple announced..."`;

        const user = haveSources
        ? `Create 6 briefing cards from these headlines grouped by category. CRITICAL: Pick ONE story from EACH category to ensure diversity. Use different sources for each card:

    TOP/WORLD NEWS (pick 1-2):
    ${JSON.stringify(itemsByCategory.top.slice(0, 5), null, 2)}

    TECH NEWS (pick 1-2):
    ${JSON.stringify(itemsByCategory.tech.slice(0, 5), null, 2)}

    SPORTS (pick 1):
    ${JSON.stringify(itemsByCategory.sports.slice(0, 5), null, 2)}

    MARKETS/BUSINESS (pick 1):
    ${JSON.stringify(itemsByCategory.markets.slice(0, 5), null, 2)}

    Return ONLY the JSON array with 6 cards total, ensuring category diversity.`
        : `Return an empty array: []`;

    const aiStart = Date.now();
    console.log("Calling OpenAI API with", allItems.length, "headlines...");
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 2000, // Limit response size for speed
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const text = resp.choices?.[0]?.message?.content ?? "[]";
    console.log(`✅ OpenAI responded in ${Date.now() - aiStart}ms, length: ${text.length}`);
    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed: any[] = [];
    try { 
      parsed = JSON.parse(cleaned);
      console.log("Successfully parsed", parsed.length, "cards");
    } catch(err) { 
      console.error("Failed to parse OpenAI response:", err);
      parsed = []; 
    }

    const now = new Date().toISOString();
    const normalized = (Array.isArray(parsed) ? parsed : [])
      .slice(0, 6)
      .map((c: any, i: number): Card => ({
        id: String(c?.id ?? `card-${i}`),
        headline: String(c?.headline ?? "Untitled"),
        summary: String(c?.summary ?? ""),
        bullets: Array.isArray(c?.bullets) ? c.bullets.slice(0, 3).map(String) : [],
        category: ["top","local","weather","markets","sports","tech"].includes(c?.category) ? c.category : "top",
        timestamp: c?.timestamp ?? now,
        citations: Array.isArray(c?.citations) ? c.citations.slice(0, 6).map(String) : [],
      }));

    const result = normalized.slice(0, 6);
    console.log(`🎉 Total fetch time: ${Date.now() - startTime}ms, returning ${result.length} cards`);
    return result;
  } catch (e) {
    console.error("❌ Hackathon fetch error:", e);
    return [];
  }
}
