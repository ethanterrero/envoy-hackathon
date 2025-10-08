# Daily News Briefing

A simple daily news briefing application that fetches news from multiple RSS sources and presents them in a clean, organized format using AI summarization.

## Features

- 📰 Fetches news from multiple RSS sources (Reuters, AP, BBC, NPR, CNN)
- 🤖 AI-powered summarization using Claude
- 💾 Smart caching - updates once per day after 6 AM
- 📱 Responsive design with Tailwind CSS
- ⚡ Fast loading with Vite

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add your Anthropic API key:**
   Edit `.env` and replace the placeholder with your actual API key:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## How it works

- The app checks if it has today's news cached in localStorage
- If it's after 6 AM and no cached news exists, it fetches fresh news
- News is fetched from multiple RSS sources and deduplicated
- Claude AI summarizes the news into digestible cards
- The same content is displayed all day until the next morning

## Project Structure

```
daily-news/
├── .env                    # Environment variables
├── index.html             # Main HTML file
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Main application component
│   ├── index.css          # Global styles
│   ├── components/
│   │   ├── Card.tsx       # News card component
│   │   └── NewsGrid.tsx   # Grid layout component
│   └── lib/
│       ├── types.ts       # TypeScript type definitions
│       ├── sources.ts     # RSS source configurations
│       ├── dedupe.ts      # News deduplication logic
│       └── fetchNews.ts   # News fetching and AI processing
```

## API Key Setup

You'll need an Anthropic API key to use Claude for news summarization:

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and get your API key
3. Add it to the `.env` file as `VITE_ANTHROPIC_API_KEY`

## Customization

- **News Sources**: Edit `src/lib/sources.ts` to add/remove RSS feeds
- **Styling**: Modify `src/index.css` and component files for different themes
- **Update Schedule**: Change the 6 AM threshold in `src/App.tsx`
- **Card Categories**: Update the category types in `src/lib/types.ts`
