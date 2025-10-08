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

// CORS proxy for hackathon
const cors = (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`;

// Parse real RSS XML and filter to last 48 hours
function parseRss(rawXml: string, source: string, category: string) {
  try {
    const doc = new DOMParser().parseFromString(rawXml, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).map(it => {
      const title = it.querySelector("title")?.textContent?.trim() ?? "";
      const url = it.querySelector("link")?.textContent?.trim() ?? "";
      const pubDate = it.querySelector("pubDate")?.textContent ?? "";
      const publishedAt = pubDate ? new Date(pubDate).toISOString() : "";
      return { title, url, publishedAt, source, category };
    }).filter(i => i.title && i.url);

    // Filter to last 48 hours only
    const FORTY_EIGHT_H = 1000 * 60 * 60 * 48;
    const now = Date.now();
    return items.filter(i => {
      if (!i.publishedAt) return false;
      const t = Date.parse(i.publishedAt);
      return Number.isFinite(t) && (now - t) <= FORTY_EIGHT_H;
    });
  } catch (e) {
    console.error(`Failed to parse RSS from ${source}:`, e);
    return [];
  }
}

// ✅ replace your fetchDailyNews with this:
export async function fetchDailyNews(): Promise<Card[]> {
  const REFRESH_HOUR = 8; // Refresh at 8:00 AM
  const CACHE_KEY = "daily-news-cards";
  const CACHE_DATE_KEY = "daily-news-date";

  // Check if we have cached data
  try {
    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getHours();
    
    const cachedCards = localStorage.getItem(CACHE_KEY);
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);

    // Use cache if it's from today and either:
    // - We haven't hit 8 AM yet, OR
    // - We already fetched at/after 8 AM today
    if (cachedCards && cachedDate === today) {
      console.log("✅ Using cached news from today");
      return JSON.parse(cachedCards);
    }

    // If cache is from yesterday and it's before 8 AM, use old cache
    if (cachedCards && currentHour < REFRESH_HOUR) {
      console.log("⏰ Before 8 AM - using yesterday's cache");
      return JSON.parse(cachedCards);
    }
  } catch (e) {
    console.log("Cache check failed, fetching fresh data");
  }

  // Fetch fresh data
  try {
    const startTime = Date.now();
    console.log("📰 Fetching fresh news...");
    
    // 📰 Real RSS feeds (direct XML)
    const FEEDS = [
      { url: "http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC News", category: "top" },
      { url: "https://www.wired.com/feed/rss", source: "Wired", category: "tech" },
      { url: "https://www.espn.com/espn/rss/news", source: "ESPN", category: "sports" },
      { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", category: "markets" },
      { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "tech" },
    ];

    const feedStart = Date.now();
    console.log("Fetching RSS feeds from", FEEDS.length, "sources...");
    
    const results = await Promise.allSettled(
      FEEDS.map(f => get(cors(f.url), 5000).then(xml => parseRss(xml, f.source, f.category)))
    );
    
    const allItems = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    
    console.log(`✅ Fetched ${allItems.length} items (last 48h) in ${Date.now() - feedStart}ms`);
    
    // Group by category
    const itemsByCategory: Record<string, typeof allItems> = {
      top: [],
      tech: [],
      sports: [],
      markets: [],
      local: [],
      weather: []
    };
    
    for (const item of allItems) {
      if (itemsByCategory[item.category]) {
        itemsByCategory[item.category].push(item);
      }
    }
    
    console.log("Items by category:", {
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

    const system = `You are a news curator. You will receive actual news article titles with publication times and URLs.

YOUR JOB: Write ONLY the summary and bullets. DO NOT modify the headline or invent details.

RULES:
1. Each input article has: title, url, publishedAt (timestamp), source, category
2. Write a 2-3 sentence summary (200-350 chars) that expands on the headline
3. DO NOT invent specific numbers, times, locations, names, or statistics
4. Keep it general and context-based
5. Write 2-3 bullet points about why this matters or key context
6. Return EXACTLY 6 cards with diverse categories

Output format:
{
  "id": "unique-id",
  "headline": "USE THE EXACT TITLE PROVIDED",
  "summary": "2-3 sentences expanding on the headline without inventing details",
  "bullets": ["2-3 context points", "not made-up facts"],
  "category": "from input",
  "timestamp": "from input publishedAt",
  "citations": ["from input source"]
}

Select 6 diverse stories:
- 1-2 from TOP/world news
- 1-2 from TECH
- 1 from SPORTS  
- 1 from MARKETS
- Use different sources for each`;

    const user = haveSources
      ? `Select 6 diverse stories from these REAL articles (published in last 48h):

TOP/WORLD (pick 1-2):
${JSON.stringify(itemsByCategory.top.slice(0, 6), null, 2)}

TECH (pick 1-2):
${JSON.stringify(itemsByCategory.tech.slice(0, 6), null, 2)}

SPORTS (pick 1):
${JSON.stringify(itemsByCategory.sports.slice(0, 6), null, 2)}

MARKETS (pick 1):
${JSON.stringify(itemsByCategory.markets.slice(0, 6), null, 2)}

Return a JSON array of 6 cards. Use the EXACT title from the input. Write summary and bullets only.`
      : `[]`;

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
    
    // Cache the results
    try {
      const today = new Date().toDateString();
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      localStorage.setItem(CACHE_DATE_KEY, today);
      console.log("💾 Cached news for today");
    } catch (e) {
      console.log("Failed to cache results");
    }
    
    return result;
  } catch (e) {
    console.error("❌ Hackathon fetch error:", e);
    
    // On error, try to return cached data as fallback
    try {
      const cachedCards = localStorage.getItem(CACHE_KEY);
      if (cachedCards) {
        console.log("⚠️ Error occurred, using cached fallback");
        return JSON.parse(cachedCards);
      }
    } catch {}
    
    return [];
  }
}
