# 📰 Envoy Daily Briefing

An AI-powered daily news briefing application built for workplace executives. Features curated news across 6 categories, live market data, and intelligent caching to minimize API costs.

![Built with React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple)

---

## 🎯 What It Does

Displays a beautiful, rotating daily briefing with:
- **6 News Categories**: Top Stories, Tech, Sports, Markets, Local (SF Bay Area), Weather
- **AI Curation**: OpenAI filters out political news and summarizes workplace-relevant stories
- **Live Market Ticker**: Real-time stock prices scrolling at the top
- **Smart Caching**: Refreshes only once daily at 8am to save API costs
- **No Politics**: Automatically filters political content to keep focus on business

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up API Keys

Create a `.env` file in the `daily-news` directory:

```env
# Required: OpenAI for AI summarization
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Required: NewsAPI for fetching articles
VITE_NEWSAPI_KEY=your_newsapi_key_here

# Optional: Alpha Vantage for market data
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

**Get Your API Keys:**
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **NewsAPI**: [newsapi.org/register](https://newsapi.org/register) (Free: 100 requests/day)
- **Alpha Vantage**: [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) (Optional)

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

---

## 🏗️ Architecture

### Data Flow

```
NewsAPI → Cache (30min) → OpenAI Summarization → Display
   ↓
Market Data → Cache (daily at 8am) → Ticker Bar
```

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Hooks
- **APIs**: OpenAI GPT-4o-mini, NewsAPI.org, Alpha Vantage
- **Caching**: localStorage with smart daily refresh

---

## 💾 Caching Strategy

### News Articles Cache
- **Key**: `envoy_news_cache`
- **Duration**: Until 8am next day
- **What's Cached**: Raw NewsAPI articles (not summaries)
- **Why**: Minimizes NewsAPI calls (100/day limit)

### Market Data Cache  
- **Key**: `envoy_market_data_cache`
- **Duration**: Until 8am next day
- **What's Cached**: Stock prices from Alpha Vantage
- **Why**: Respects API rate limits (5 calls/min)

### Cache Refresh Logic
- Only fetches new data if it's a **new day** AND **past 8am**
- On page reload: uses cache (instant load!)
- After 8am: fetches fresh data once, then caches again

**Clear Cache Manually:**
```javascript
// In browser console
localStorage.removeItem("envoy_news_cache")
localStorage.removeItem("envoy_market_data_cache")
location.reload()
```

---

## 📁 Project Structure

```
daily-news/
├── src/
│   ├── components/
│   │   └── TickerBar.tsx          # Market data ticker
│   ├── util/
│   │   ├── cache.ts               # Shared caching utility
│   │   ├── fetchNewsArticles.ts   # NewsAPI integration
│   │   ├── fetchDailyNews.ts      # OpenAI summarization
│   │   └── marketData.ts          # Alpha Vantage integration
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── .env                           # API keys (create this!)
├── package.json
└── README.md
```

---

## 🎨 Features in Detail

### 1. Political Content Filtering
NewsAPI queries include filters to exclude political news:
```
NOT politics NOT election NOT government
```

### 2. AI Summarization
OpenAI receives articles and creates:
- **Headline**: Max 80 characters
- **Summary**: 2-3 sentences, max 350 characters  
- **Bullets**: 2-3 key facts, max 20 words each
- **Citations**: Always includes source name and URL

### 3. Source Validation
Code automatically rejects invalid sources like:
- "TOP NEWS", "TECH", "SPORTS" (category names)
- Empty citations
- Missing URLs

Fallback sources are used if validation fails.

### 4. Duplicate Code Elimination
Created a shared `cache.ts` utility to eliminate 80+ lines of duplicate caching code between news and market data files.

---

## 🔧 Development

### View Cached Data
```javascript
// In browser console
JSON.parse(localStorage.getItem("envoy_news_cache"))
JSON.parse(localStorage.getItem("envoy_market_data_cache"))
```

### Force Fresh Data
```javascript
localStorage.clear()
location.reload()
```

### Check Cache Status
```javascript
const cache = JSON.parse(localStorage.getItem("envoy_news_cache"))
console.log("Last fetch:", cache.lastFetchDate)
console.log("Timestamp:", new Date(cache.timestamp))
```

---

## 📊 API Usage & Costs

### NewsAPI (Free Tier)
- **Limit**: 100 requests/day
- **Our Usage**: 1 request/day at 8am
- **Queries**: 6 categories fetched in parallel
- **Cost**: FREE ✅

### OpenAI (Paid)
- **Model**: GPT-4o-mini
- **Our Usage**: 1 request per page load
- **Input**: ~2000 tokens (articles)
- **Output**: ~1500 tokens (summaries)
- **Cost**: ~$0.02 per request 💰

### Alpha Vantage (Free Tier)
- **Limit**: 5 calls/min, 100/day
- **Our Usage**: 1 request/day at 8am
- **Symbols**: 8 stocks (SPY, QQQ, AAPL, etc.)
- **Cost**: FREE ✅

**Daily Total**: ~$0.02 per user per day

---

## ⚡ Performance

### Load Times
- **First Load** (no cache): ~28 seconds (fetching + AI)
- **Cached Load**: ~500ms ⚡

### Optimizations
1. ✅ Daily caching (8am refresh)
2. ✅ No polling/intervals
3. ✅ Parallel API calls
4. ✅ React Strict Mode disabled (no double renders)
5. ✅ Shared caching utility (DRY code)

---

## 🐛 Troubleshooting

### Issue: Double API Calls
**Solution**: We removed React StrictMode which was causing double renders in development.

### Issue: "No quote data found" for stocks
**Cause**: Invalid/missing Alpha Vantage API key or rate limit  
**Solution**: Ticker shows default data gracefully. Add valid API key to `.env`

### Issue: Political news showing up
**Cause**: NewsAPI query filters not working  
**Solution**: We added NOT filters and LLM validation to reject political content

### Issue: Missing sources ("TOP NEWS")
**Cause**: LLM returning category names as sources  
**Solution**: Added validation layer that rejects category names and enforces real sources

---

## 🎯 Design Decisions

### Why Cache Until 8am?
- News updates overnight
- Users typically check briefings in morning
- Saves API costs (1 call/day vs 100+/day)

### Why Not Cache Final Cards?
- **Current**: Cache raw articles, regenerate summaries
- **Trade-off**: Costs ~$0.02 per load but ensures fresh AI curation
- **Future**: Could cache final cards too for more savings

### Why Remove Strict Mode?
- Caused double useEffect runs in development
- Led to duplicate API calls and confusion
- Not needed for this production-focused app

### Why No Real-time Market Data?
- Workplace briefings don't need live updates
- Daily snapshot is sufficient
- Massive API cost savings

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Environment Variables
Make sure to set these in your hosting platform:
- `VITE_OPENAI_API_KEY`
- `VITE_NEWSAPI_KEY`  
- `VITE_ALPHA_VANTAGE_API_KEY`

---

## 📝 Future Enhancements

- [ ] Cache final cards (save $$$)
- [ ] User preferences (categories, refresh time)
- [ ] Email digest option
- [ ] Mobile app version
- [ ] Admin dashboard for cache management
- [ ] Multi-location support (not just SF Bay Area)

---

## 🙏 Credits

Built for the Envoy Hackathon using:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI API](https://platform.openai.com/)
- [NewsAPI](https://newsapi.org/)
- [Alpha Vantage](https://www.alphavantage.co/)

---

## 📄 License

MIT License - feel free to use this code for your own projects!

---

## 🤔 Questions?

Check the inline code comments or open an issue. The codebase is well-documented and follows React best practices.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
