import { useEffect, useState } from "react";
import { fetchDailyNews, type Card } from "./util/fetchDailyNews";
import "./index.css";



export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // TESTING MODE: Always fetch fresh data (bypass cache)
      console.log("Fetching fresh news from OpenAI...");
      const fresh = await fetchDailyNews();
      console.log("Received cards:", fresh);
      setCards(fresh);
      setLoading(false);
    };
    init();
  }, []);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        Loading daily briefing...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <header className="bg-slate-800/50 border-b border-slate-700 px-8 py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Daily News Briefing
        </h1>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {cards.length > 0 ? (
          <div className="grid grid-cols-3 gap-8">
            {cards.map((c) => (
              <div key={c.id} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 flex flex-col">
                <div className="inline-block px-3 py-1 mb-4 text-sm bg-blue-500/20 text-blue-300 rounded-full self-start">
                  {c.category.toUpperCase()}
                </div>
                <h2 className="text-xl font-bold mb-3">{c.headline}</h2>
                <p className="text-slate-300 mb-4 leading-relaxed">{c.summary}</p>
                <ul className="space-y-2 mb-4">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-200">
                      <span className="text-blue-400 mr-2 mt-0.5">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {c.citations && c.citations.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      Source: {c.citations.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            No news yet — check after 6:00 AM.
          </div>
        )}
      </main>
    </div>
  );
}
