import { useState, useEffect } from 'react';
import { NewsGrid } from './components/NewsGrid';
import { fetchDailyNews } from './lib/fetchNews';
import type { Card } from './lib/types';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    const loadNews = async () => {
      try {
        console.log('Starting to load news...');
        const now = new Date();
        const today = now.toDateString();
        
        // Check cache
        const cachedData = localStorage.getItem('daily-news');
        const cachedDate = localStorage.getItem('daily-news-date');
        const cachedTime = localStorage.getItem('daily-news-time');
        
        console.log('Cache check:', { cachedData: !!cachedData, cachedDate, today, currentHour: now.getHours() });
        
        // SIMPLIFIED LOGIC: Always fetch fresh news for now
        // TODO: Add proper caching logic later
        console.log('Fetching fresh news (simplified logic)');
        
        // Always fetch fresh news on initial load or before 6 AM
        console.log('Fetching fresh news...');
        setLoading(true);
        
        try {
          const freshCards = await fetchDailyNews();
          console.log('Fetched cards:', freshCards.length, freshCards);
          
          if (freshCards && freshCards.length > 0) {
            setCards(freshCards);
            setLastUpdate(new Date());
            
            // Save to cache
            localStorage.setItem('daily-news', JSON.stringify(freshCards));
            localStorage.setItem('daily-news-date', today);
            localStorage.setItem('daily-news-time', new Date().toISOString());
            console.log('Successfully set cards and cached data');
          } else {
            console.log('No cards returned, using fallback cards');
            // Create fallback cards if AI processing fails
            const fallbackCards = [
              {
                id: 'fallback-1',
                headline: 'Welcome to Daily News Briefing',
                summary: 'This is a sample news card to demonstrate the application functionality.',
                bullets: ['Application is working correctly', 'AI processing may need API key', 'Mock data is being displayed'],
                category: 'top' as const,
                timestamp: new Date().toISOString(),
                citations: ['https://example.com']
              },
              {
                id: 'fallback-2',
                headline: 'Tech News Update',
                summary: 'Latest developments in technology and artificial intelligence.',
                bullets: ['AI advancements continue', 'New software releases', 'Industry trends emerging'],
                category: 'top' as const,
                timestamp: new Date().toISOString(),
                citations: ['https://example.com']
              },
              {
                id: 'fallback-3',
                headline: 'Global Climate Summit Results',
                summary: 'World leaders reach historic agreement on carbon reduction targets.',
                bullets: ['New emissions targets set', 'Renewable energy commitments', 'International cooperation strengthened'],
                category: 'top' as const,
                timestamp: new Date().toISOString(),
                citations: ['https://example.com']
              },
              {
                id: 'fallback-4',
                headline: 'Stock Markets Show Strong Gains',
                summary: 'Major indices post significant weekly gains as investor confidence grows.',
                bullets: ['Tech stocks lead the rally', 'Energy sector shows recovery', 'Market volatility decreases'],
                category: 'markets' as const,
                timestamp: new Date().toISOString(),
                citations: ['https://example.com']
              },
              {
                id: 'fallback-5',
                headline: 'Medical Breakthrough in Cancer Treatment',
                summary: 'Researchers announce promising results from new immunotherapy approach.',
                bullets: ['Improved patient outcomes', 'Reduced side effects', 'Clinical trials expanded'],
                category: 'top' as const,
                timestamp: new Date().toISOString(),
                citations: ['https://example.com']
              },
              {
                id: 'fallback-6',
                headline: 'Championship Finals This Weekend',
                summary: 'Top teams compete for the season championship title.',
                bullets: ['High-stakes matchups', 'Record attendance expected', 'Broadcast coverage expanded'],
                category: 'sports' as const,
                timestamp: new Date().toISOString(),
                citations: ['https://example.com']
              }
            ];
            setCards(fallbackCards);
            setLastUpdate(new Date());
            console.log('Set fallback cards');
          }
        } catch (fetchError) {
          console.error('Error in fetchDailyNews:', fetchError);
          setError('Failed to fetch news: ' + (fetchError as Error).message);
        }
        
      } catch (err) {
        console.error('Error loading news:', err);
        setError('Failed to load news briefing: ' + (err as Error).message);
        
        // Try to use cached data as fallback
        const cachedData = localStorage.getItem('daily-news');
        if (cachedData) {
          console.log('Using fallback cached data');
          setCards(JSON.parse(cachedData));
          const cachedTime = localStorage.getItem('daily-news-time');
          setLastUpdate(cachedTime ? new Date(cachedTime) : null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadNews();
  }, []); // Run only once on mount
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1f2937'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #dc2626',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '24px', color: '#374151', fontWeight: '500' }}>Loading daily briefing...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  if (error && cards.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1f2937'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '24px', color: '#dc2626', marginBottom: '16px', fontWeight: '500' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      color: '#1f2937'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e3a8a',
        borderBottom: '1px solid #e5e7eb',
        padding: '24px 0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '30px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0
              }}>
                Daily News Briefing
              </h1>
              {lastUpdate && (
                <p style={{ color: '#d1d5db', marginTop: '4px', margin: 0, fontSize: '14px' }}>
                  Updated: {lastUpdate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })} at {lastUpdate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
            <div style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* News Grid */}
      <NewsGrid cards={cards} />
    </div>
  );
}

export default App;
