import OpenAI from "openai";
import { fetchNewsArticles, formatArticlesForLLM, type NewsByCategory } from "./fetchNewsArticles";

export interface Card {
  id: string;
  headline: string;
  summary: string;
  bullets: string[];
  category: string;
  timestamp: string;
  citations: string[];
}

type Category = "top" | "tech" | "sports" | "markets" | "local" | "weather";

const CATEGORY_ORDER: Category[] = ["top", "tech", "sports", "markets", "local", "weather"];



function buildPrompts(requestDate: Date, newsByCategory: NewsByCategory) {
  const isoDate = requestDate.toISOString().split("T")[0] ?? "";
  const prettyDate = requestDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const systemPrompt = `You are an Envoy newsroom editor. Today is ${prettyDate} and the current ISO date is ${isoDate}.

Your job is to build a six-card daily workplace briefing that executives can skim quickly.

You will be provided with recent news articles for each category. Your task is to curate and summarize them into cards.

CRITICAL REQUIREMENTS:
- Return exactly six cards as JSON. Each card maps to one category: top, tech, sports, markets, local, weather.
- Create an engaging headline (<= 80 characters) that captures the essence of the story.
- Write a clear summary (2-3 sentences, <= 350 characters) with concrete names, numbers, or key facts.
- Provide 2-3 bullet points (<= 20 words each) with additional factual highlights.
- ALWAYS include at least one citation formatted EXACTLY as "Source Name — https://url" using the article URLs provided.
- NEVER return empty citations arrays. NEVER return "SOURCE UNAVAILABLE" or placeholders.
- Use the article's published timestamp as the card timestamp.
- Focus on workplace relevance and executive interests.
- Avoid political news - focus on business, innovation, sports, and practical workplace topics.

Return only a JSON object with a single property "cards" containing the array of card objects. Do not add commentary.`;

  // Format articles for each category
  const categoryPrompts = CATEGORY_ORDER.map((category) => {
    const articles = newsByCategory[category] || [];
    const articlesText = formatArticlesForLLM(articles);
    
    const categoryDescriptions: Record<Category, string> = {
      top: "major national or global development with workplace impact",
      tech: "technology, AI, or workplace tools",
      sports: "headline moment, ideally with fan or business angle",
      markets: "business, finance, or corporate operations trend",
      local: "San Francisco Bay Area workplace, commuting, or civic update",
      weather: "notable U.S. or global weather event affecting workplaces or travel",
    };
    
    return `
### ${category.toUpperCase()} NEWS (${categoryDescriptions[category]}):
${articlesText || 'No articles available for this category.'}
`.trim();
  }).join('\n\n---\n\n');

  const userPrompt = `Produce the Envoy workplace briefing for ${prettyDate} using the articles provided below.

${categoryPrompts}

MANDATORY CONSTRAINTS:
1. Create exactly one card for each category in this order: top, tech, sports, markets, local, weather.
2. Use ONLY the articles provided above. Do not invent information.
3. Choose the most relevant workplace-focused, non-political article from each category's list.
4. Citations MUST use EXACTLY this format: "Source Name — https://url" 
   - Example: "Reuters — https://reuters.com/article/123"
   - Example: "TechCrunch — https://techcrunch.com/story"
   - Extract the EXACT source name from the "Source:" field in the articles above
   - Extract the EXACT URL from the "URL:" field in the articles above
5. EVERY card MUST have at least one valid citation with both source name AND URL.
6. DO NOT use category names as sources (e.g., "TOP NEWS", "TECH", etc.)
7. If a category has no articles, use: ["News — https://news.envoy.com"]
8. Headline <= 80 characters, summary <= 350 characters.
9. 2-3 bullets per card, each <= 20 words.

EXAMPLE CITATION FORMAT:
citations: ["CNN — https://cnn.com/article/example"]

Return only a JSON object with a single property "cards" that contains the array of card objects.`;

  return { systemPrompt, userPrompt };
}

function coerceString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function normalizeCategory(value: unknown, fallback: Category): Category {
  if (typeof value === "string") {
    const lower = value.toLowerCase() as Category;
    if (CATEGORY_ORDER.includes(lower)) return lower;
  }
  return fallback;
}

function toStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];

  const asStrings = value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object") {
        const maybeName = "name" in entry ? coerceString((entry as Record<string, unknown>).name) : "";
        const maybeTitle = "title" in entry ? coerceString((entry as Record<string, unknown>).title) : "";
        const maybeUrl = "url" in entry ? coerceString((entry as Record<string, unknown>).url) : "";
        if (maybeName && maybeUrl) return `${maybeName} — ${maybeUrl}`;
        if (maybeTitle && maybeUrl) return `${maybeTitle} — ${maybeUrl}`;
        if (maybeUrl) return maybeUrl;
      }
      return coerceString(entry).trim();
    })
    .filter(Boolean);

  return asStrings.slice(0, limit);
}

function formatCitationEntry(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.includes(" — ")) return trimmed;

  const urlMatch = trimmed.match(/https?:\/\/\S+/);
  if (!urlMatch) return trimmed;

  const rawUrl = urlMatch[0].replace(/[)\].,;]+$/, "");
  let label = trimmed.replace(urlMatch[0], "").trim().replace(/^[-–—:•]+/, "").trim();

  if (!label) {
    try {
      const hostname = new URL(rawUrl).hostname.replace(/^www\./, "");
      label = hostname;
    } catch {
      label = "Source";
    }
  }

  return `${label} — ${rawUrl}`;
}

export async function fetchDailyNews(): Promise<Card[]> {
  const startTime = Date.now();
  const requestDate = new Date();
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing VITE_OPENAI_API_KEY");
      return [];
    }

    // Step 1: Fetch fresh news articles from NewsAPI
    console.log("📰 Fetching news articles from NewsAPI...");
    const newsByCategory = await fetchNewsArticles();

    // Step 2: Use LLM to curate and summarize
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const { systemPrompt, userPrompt } = buildPrompts(requestDate, newsByCategory);

    console.log("🤖 Generating briefing summaries via OpenAI...");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content ?? "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
      console.log("✅ Parsed structured response");
    } catch (err) {
      console.error("Failed to parse JSON response from OpenAI:", err);
      parsed = { cards: [] };
    }

    const fallbackTimestamp = requestDate.toISOString();
    const parsedObject: Record<string, unknown> =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    const maybeCards = parsedObject.cards as unknown;
    const normalized = Array.isArray(maybeCards) ? maybeCards : [];

    const cards = normalized.slice(0, CATEGORY_ORDER.length).map((item, idx) => {
      const fallbackCategory = CATEGORY_ORDER[idx] ?? "top";
      const record = (item ?? {}) as Record<string, unknown>;

      const bullets = toStringArray(record.bullets, 3);
      if (bullets.length === 1) {
        const summaryLead = coerceString(record.summary).split(". ")[0]?.trim();
        if (summaryLead) bullets.push(summaryLead);
      }

      const rawCitations = toStringArray(record.citations, 6);
      const seenCitations = new Set<string>();
      const invalidSources = ['TOP NEWS', 'TOP', 'TECH NEWS', 'TECH', 'SPORTS NEWS', 'SPORTS', 'MARKETS NEWS', 'MARKETS', 'LOCAL NEWS', 'LOCAL', 'WEATHER NEWS', 'WEATHER'];
      
      let citations = rawCitations
        .map(formatCitationEntry)
        .filter((entry) => {
          if (!entry) return false;
          if (seenCitations.has(entry)) return false;
          
          // Reject citations that are just category names
          const sourceName = entry.split(' — ')[0]?.toUpperCase().trim();
          if (sourceName && invalidSources.includes(sourceName)) {
            console.warn(`⚠️ Rejecting invalid citation: ${entry}`);
            return false;
          }
          
          seenCitations.add(entry);
          return true;
        });

      if (citations.length === 0) {
        const fallbackSource =
          coerceString(
            (record as Record<string, unknown>).source ??
              (record as Record<string, unknown>).outlet ??
              (record as Record<string, unknown>).publication,
          ) || "";
        const fallbackUrl =
          coerceString(
            (record as Record<string, unknown>).url ??
              (record as Record<string, unknown>).article_url ??
              (record as Record<string, unknown>).link,
          ) || "";
        if (fallbackUrl) {
          citations = [
            formatCitationEntry(
              fallbackSource ? `${fallbackSource} — ${fallbackUrl}` : fallbackUrl,
            ),
          ].filter(Boolean);
        }
        
        // Final fallback: if still no citations, use category-appropriate source
        if (citations.length === 0) {
          const categoryName = normalizeCategory(record.category, fallbackCategory);
          citations = [`${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} News — https://news.envoy.com`];
          console.warn(`⚠️ No citation found for ${categoryName} card, using fallback`);
        }
      }

      return {
        id: coerceString(record.id, `card-${idx}`),
        headline: coerceString(record.headline, "Untitled"),
        summary: coerceString(record.summary),
        bullets,
        category: normalizeCategory(record.category, fallbackCategory),
        timestamp: coerceString(record.timestamp, fallbackTimestamp),
        citations,
      } satisfies Card;
    });

    // If the model returned fewer than 6 cards, pad with empty shells to keep UI stable.
    while (cards.length < CATEGORY_ORDER.length) {
      const idx = cards.length;
      cards.push({
        id: `card-${idx}`,
        headline: "Briefing update unavailable",
        summary: "The latest update for this category is still loading.",
        bullets: [],
        category: CATEGORY_ORDER[idx] ?? "top",
        timestamp: fallbackTimestamp,
        citations: [],
      });
    }

    console.log(`🎉 Total fetch time: ${Date.now() - startTime}ms, returning ${cards.length} cards`);
    return cards.slice(0, CATEGORY_ORDER.length);
  } catch (error) {
    console.error("❌ OpenAI web search fetch error:", error);
    return [];
  }
}
