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

type Category = "top" | "tech" | "sports" | "markets" | "local" | "weather";

const CATEGORY_ORDER: Category[] = ["top", "tech", "sports", "markets", "local", "weather"];

function buildPrompts(requestDate: Date) {
  const isoDate = requestDate.toISOString().split("T")[0] ?? "";
  const prettyDate = requestDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const systemPrompt = `You are an Envoy newsroom editor with live web access. Today is ${prettyDate} and the current ISO date is ${isoDate}.

Your job is to build a six-card daily workplace briefing that executives can skim quickly.

Non-negotiables:
- You MUST run fresh web searches before answering so every card is grounded in reporting published on ${isoDate}. If a candidate article was not published on ${isoDate}, you must discard it and find one that was.
- Return exactly six cards as JSON. Each card maps to one category: top, tech, sports, markets, local, weather.
- Summaries must include concrete names, numbers, quotes, or dates pulled directly from the cited article.
- Every card must include at least one citation formatted as "Outlet — https://link" that points to the article you used. Do not invent outlets or URLs and never return placeholder text like "source unavailable".
- Bullet points are short (<= 20 words) factual highlights that extend the summary.
- Timestamps are ISO 8601 strings using the article’s publish time on ${isoDate}. If the article does not list a publish time, use ${isoDate} with the current UTC time.

Return only the JSON array of card objects defined above. Do not add commentary.`;

  const userPrompt = `Produce the Envoy workplace briefing for ${prettyDate} using the OpenAI web search tool.

Constraints:
1. Categories (exactly one card each, in this order):
   - top: major national or global development with workplace impact.
   - tech: technology, AI, or workplace tools.
   - sports: headline moment, ideally with fan or business angle.
   - markets: business, finance, or corporate operations trend.
   - local: San Francisco Bay Area workplace, commuting, or civic update.
   - weather: notable U.S. or global weather event affecting workplaces or travel.
2. Each card must cite a DIFFERENT publication. Verify the article publish date is ${isoDate} before citing it.
3. Citations array must contain strings formatted exactly as "Outlet — https://link".
4. Bullets must be 2 or 3 concise facts that add new detail beyond the summary.
5. Headline <= 80 characters, summary 2–3 sentences (<= 350 characters).

Return only the JSON array of card objects.`;

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

    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const { systemPrompt, userPrompt } = buildPrompts(requestDate);

    console.log("🌐 Fetching briefing via OpenAI web search…");
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_output_tokens: 1500,
      tools: [{ type: "web_search" }],
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    });

    const rawText = response.output_text ?? "[]";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
      console.log("✅ Parsed structured response");
    } catch (err) {
      console.error("Failed to parse JSON response from OpenAI:", err);
      parsed = [];
    }

    const fallbackTimestamp = requestDate.toISOString();
    const normalized = Array.isArray(parsed) ? parsed : [];

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
      let citations = rawCitations
        .map(formatCitationEntry)
        .filter((entry) => {
          if (!entry) return false;
          if (seenCitations.has(entry)) return false;
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
