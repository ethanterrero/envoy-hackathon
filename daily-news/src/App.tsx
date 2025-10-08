import { useEffect, useMemo, useState } from "react";
import { fetchDailyNews, type Card } from "./util/fetchDailyNews";
import "./index.css";

const categoryStyles: Record<string, string> = {
  top: "bg-[#ffe7de] text-[#ff4f00]",
  tech: "bg-[#e6f0ff] text-[#2c5cff]",
  sports: "bg-[#e8f8f0] text-[#0f9158]",
  markets: "bg-[#fff3d9] text-[#c76b00]",
  local: "bg-[#f1ecff] text-[#5d3dce]",
  weather: "bg-[#e1f5ff] text-[#0077b6]",
};

function getCategoryStyle(category: string) {
  return categoryStyles[category] ?? "bg-slate-200 text-slate-700";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTimeFrom(timestamp: string | undefined, now: Date) {
  if (!timestamp) return null;
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();
  if (Number.isNaN(diff)) return null;

  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const init = async () => {
      const fresh = await fetchDailyNews();
      setCards(fresh);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const leadCard = cards[0];
  const secondaryCards = cards.slice(1, 3);
  const gridCards = cards.slice(3);

  const categories = useMemo(
    () => Array.from(new Set(cards.map((card) => card.category))),
    [cards],
  );

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fc] text-slate-500">
        <span className="text-xs font-semibold uppercase tracking-[0.5em] text-[#ff4f00]">
          Envoy
        </span>
        <p className="mt-4 text-lg font-medium">Curating today’s workplace briefing…</p>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-[#ff8b69]/40 via-[#ff4f00]/20 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-44 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-[#6b5bff]/30 via-[#c9c0ff]/20 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/2 h-[24rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#ffb347]/25 via-[#ff6f61]/20 to-transparent blur-[160px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 py-10 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.5em] text-[#ff4f00]">
                Envoy
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Workplace Daily Briefing
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
                Today’s curated headlines for every Envoy workplace team. Designed for ambient
                displays—no interaction required, just the signals that matter.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                Today
              </div>
              <div className="mt-2 text-3xl font-semibold sm:text-4xl">{formatTime(now)}</div>
              <div className="text-sm font-medium text-slate-500">{formatDate(now)}</div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-slate-600 shadow-sm ring-1 ring-slate-200"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </header>

        <main className="flex-1 px-6 pb-20 sm:px-12 lg:px-20">
          {leadCard ? (
            <section className="grid gap-10 xl:grid-cols-[2fr,1fr]">
              <article className="rounded-[32px] bg-white p-10 shadow-2xl shadow-slate-900/5 ring-1 ring-slate-200/70">
                <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-1 tracking-widest ${getCategoryStyle(leadCard.category)}`}
                  >
                    {leadCard.category}
                  </span>
                  <span className="text-slate-400">Lead Story</span>
                </div>
                <h2 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                  {leadCard.headline}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">{leadCard.summary}</p>
                <ul className="mt-8 space-y-4 text-sm text-slate-600">
                  {leadCard.bullets.map((bullet, index) => (
                    <li key={index} className="flex gap-3 leading-relaxed">
                      <span className="mt-[7px] h-2 w-2 rounded-full bg-[#ff4f00]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff4f00]" />
                    {leadCard.citations.length > 0 ? leadCard.citations.join(" • ") : "Source unavailable"}
                  </span>
                  <span>
                    Updated {relativeTimeFrom(leadCard.timestamp, now) ?? "moments ago"}
                  </span>
                </div>
              </article>

              <aside className="flex flex-col gap-6">
                <div className="rounded-[28px] bg-white/70 p-8 shadow-xl shadow-slate-900/5 ring-1 ring-white/60 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#ff4f00]">
                    Envoy Pulse
                  </p>
                  <p className="mt-4 text-lg font-medium text-slate-700">
                    The latest signals teams should know before doors open.
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Keep facilities, security, and workplace leaders aligned with a quick glance.
                    Designed to run continuously on lobby and operations displays.
                  </p>
                </div>

                {secondaryCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-[28px] bg-white p-7 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      <span className={`rounded-full px-4 py-1 ${getCategoryStyle(card.category)}`}>
                        {card.category}
                      </span>
                      <span>{relativeTimeFrom(card.timestamp, now) ?? "Today"}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-900">{card.headline}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {card.summary}
                    </p>
                    {card.citations.length > 0 && (
                      <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                        {card.citations.join(" • ")}
                      </p>
                    )}
                  </div>
                ))}
              </aside>
            </section>
          ) : (
            <section className="rounded-[32px] bg-white p-12 text-center shadow-2xl shadow-slate-900/5 ring-1 ring-slate-200/70">
              <p className="text-lg text-slate-500">
                No stories yet. The Envoy briefing will populate once morning feeds are available.
              </p>
            </section>
          )}

          {gridCards.length > 0 && (
            <section className="mt-16">
              <div className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">
                Across the Workplace
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {gridCards.map((card) => (
                  <article
                    key={card.id}
                    className="relative overflow-hidden rounded-[28px] bg-white p-8 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70"
                  >
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] ${getCategoryStyle(card.category)}`}
                    >
                      {card.category}
                    </span>
                    <h3 className="mt-5 text-2xl font-semibold text-slate-900">{card.headline}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {card.summary}
                    </p>
                    <ul className="mt-5 space-y-3 text-xs text-slate-500">
                      {card.bullets.map((bullet, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    {card.citations.length > 0 && (
                      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                        {card.citations.join(" • ")}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
