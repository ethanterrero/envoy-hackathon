# Envoy Daily Briefing

A modern daily news briefing application built with React, TypeScript, and Vite. Displays curated news across multiple categories (top stories, tech, sports, markets, local, weather) with live market data.

## Features

- 📰 Real-time news from NewsAPI.org across 6 categories
- 🤖 AI-powered summarization using OpenAI
- 📊 Live market ticker with intelligent caching
- ⚡ Fast, responsive UI built with React + Vite
- 🎨 Beautiful Tailwind CSS design

## Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Required API keys:
   - **VITE_OPENAI_API_KEY**: Get from [OpenAI](https://platform.openai.com/api-keys)
   - **VITE_NEWSAPI_KEY**: Get from [NewsAPI.org](https://newsapi.org/register) (free tier: 100 requests/day)
   - **VITE_ALPHA_VANTAGE_API_KEY** (optional): Get from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Architecture

- **News Fetching**: NewsAPI.org provides real-time articles (cached for 30 minutes)
- **Summarization**: OpenAI GPT-4o-mini curates and summarizes articles
- **Market Data**: Alpha Vantage API (cached for 10 minutes)
- **Caching**: Smart localStorage caching to minimize API calls

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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
