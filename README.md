# Envoy News - Claude-Powered News Events Web Component

A React-based news events application powered by Claude AI, packaged as a custom web component that displays real-time news updates in an engaging format.

## Architecture Overview

This project follows the same three-file architecture pattern as the clock component, but adapted for news events:

### File Structure

```
├── App.tsx           # React component with news fetching and Claude integration
├── index.css         # Styling for the news display
└── NewsWidget.tsx    # Web component wrapper and registration
```

## How to Build This Following the Clock Pattern

### 1. `App.tsx` - React News Component
- **Purpose**: Contains the core React component that manages news state and Claude API integration
- **Key Features**:
  - Uses React hooks (`useState`, `useEffect`) to manage news state
  - Fetches news from external APIs (NewsAPI, RSS feeds, etc.)
  - Sends news data to Claude API for processing and summarization
  - Updates periodically to show fresh news content
  - Renders processed news in a container div with the class `news-container`

**Key Logic**:
```typescript
const [news, setNews] = useState([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const fetchAndProcessNews = async () => {
    setIsLoading(true)
    const rawNews = await fetchNewsFromAPI()
    const claudeProcessed = await sendToClaude(rawNews)
    setNews(claudeProcessed)
    setIsLoading(false)
  }
  
  fetchAndProcessNews()
  const interval = setInterval(fetchAndProcessNews, 300000) // 5 minutes
  return () => clearInterval(interval)
}, [])
```

### 2. `index.css` - Styling
- **Purpose**: Defines the visual appearance of the news widget
- **Key Features**:
  - Uses Tailwind CSS utility classes with `@apply` directive
  - Full-screen or widget-sized background
  - Card-based layout for news articles
  - Responsive typography for headlines and summaries
  - Smooth animations for content updates

**Visual Design**:
- Clean, modern card-based layout
- Responsive typography scaling
- Smooth fade-in animations for new content
- Professional color scheme with good contrast

### 3. `NewsWidget.tsx` - Web Component Wrapper
- **Purpose**: Wraps the React component as a custom web element
- **Key Features**:
  - Extends a `Base` class (from shared library)
  - Registers the custom element as `x-envoy-news`
  - Includes appropriate fonts for readability
  - Bundles the CSS styles as a raw string
  - Configures Claude API settings

**Component Registration**:
```typescript
class NewsWidget extends Base {
  app = (<App />)
  styles = styles
  options: BaseOptions = { 
    fonts: [enums.Fonts.SOFIA_PRO],
    claudeApiKey: process.env.CLAUDE_API_KEY
  }
}
customElements.define('x-envoy-news', NewsWidget)
```

## Data Flow

1. **Initialization**: The `NewsWidget` class instantiates and configures the React `App` component
2. **News Fetching**: Component fetches raw news from external APIs
3. **Claude Processing**: Raw news is sent to Claude API for summarization and enhancement
4. **State Update**: Processed news updates the React state
5. **Rendering**: Enhanced news content is displayed in styled cards
6. **Periodic Updates**: Process repeats every 5 minutes for fresh content

## Usage

Once the web component is registered, you can use it in any HTML page:

```html
<x-envoy-news></x-envoy-news>
```

## Claude Integration Features

- 📰 **Smart Summarization**: Claude processes raw news into concise, readable summaries
- 🎯 **Relevance Filtering**: AI filters news by relevance and importance
- 🔄 **Content Enhancement**: Claude adds context and analysis to news stories
- 📱 **Format Optimization**: AI adapts content for optimal display format
- 🌐 **Multi-source Aggregation**: Combines news from multiple sources intelligently

## Dependencies

- **React**: For component state management and lifecycle
- **Claude API**: For AI-powered news processing and enhancement
- **News APIs**: For fetching raw news data (NewsAPI, RSS feeds, etc.)
- **Shared Library**: Provides `Base` class, `BaseOptions`, and font enums
- **Tailwind CSS**: For utility-first styling
- **Custom Elements API**: For web component registration

## Features

- 🤖 Claude AI-powered content processing
- 📰 Real-time news aggregation
- 🎨 Modern, responsive design
- 🔄 Automatic content updates (every 5 minutes)
- 📱 Mobile-optimized layout
- 🎯 Smart content filtering and prioritization
- 🔤 Professional typography (Sofia Pro)
- 🧩 Reusable web component architecture

## Technical Details

- **Update Frequency**: 5-minute intervals for fresh news content
- **Claude Integration**: Processes raw news for better readability and relevance
- **Styling**: Uses Tailwind CSS with professional color palette
- **Font**: Sofia Pro for optimal readability
- **Responsive**: Adapts to different screen sizes and container dimensions
- **API Rate Limiting**: Respects Claude API limits and external news API quotas

## Implementation Steps

1. **Set up React component** with news fetching logic
2. **Integrate Claude API** for content processing
3. **Style with Tailwind CSS** following the clock component pattern
4. **Wrap in web component** using the Base class architecture
5. **Configure fonts and options** in the component registration
6. **Test and deploy** as a reusable web component