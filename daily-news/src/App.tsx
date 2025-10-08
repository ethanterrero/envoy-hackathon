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
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
      {/* Compact Top Bar */}
      <nav className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Daily Briefing</h1>
              <p className="text-sm text-slate-500">AI-curated news from trusted sources</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </nav>

      {/* Fixed Grid - 2 Rows x 3 Columns */}
      <main className="flex-1 overflow-hidden p-6">
        {cards.length > 0 ? (
          <div className="h-full grid grid-cols-3 grid-rows-2 gap-4">
            {cards.map((c) => (
              <div 
                key={c.id} 
                className="bg-white rounded-lg p-5 border-2 border-slate-200 flex flex-col overflow-hidden"
              >
                {/* Category Badge */}
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1.5 text-sm font-bold rounded ${
                    c.category === 'tech' ? 'bg-blue-50 text-blue-700' :
                    c.category === 'sports' ? 'bg-emerald-50 text-emerald-700' :
                    c.category === 'markets' ? 'bg-purple-50 text-purple-700' :
                    c.category === 'top' ? 'bg-orange-50 text-orange-700' :
                    'bg-slate-50 text-slate-700'
                  }`}>
                    {c.category.toUpperCase()}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight line-clamp-2">
                  {c.headline}
                </h3>

                {/* Summary */}
                <p className="text-slate-700 mb-3 text-sm leading-relaxed line-clamp-3">
                  {c.summary}
                </p>

                {/* Key Points */}
                <div className="mb-2 flex-grow">
                  {c.bullets.slice(0, 2).map((b, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                      <span className="text-xs text-slate-600 leading-snug line-clamp-2">{b}</span>
                    </div>
                  ))}
                </div>

                {/* Source */}
                {c.citations && c.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 mt-auto">
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {c.citations.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-slate-600 font-bold text-xl">No news available</p>
              <p className="text-slate-500 text-sm mt-1">Check back later for updates</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
