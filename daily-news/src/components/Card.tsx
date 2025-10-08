import type { Card as CardType } from '../lib/types';

interface CardProps {
  card: CardType;
}

export function Card({ card }: CardProps) {
  // Enhanced color mapping for categories
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'top': return { 
        bg: '#dc2626', 
        text: '#ffffff', 
        label: 'BREAKING'
      };
      case 'markets': return { 
        bg: '#059669', 
        text: '#ffffff', 
        label: 'MARKETS'
      };
      case 'sports': return { 
        bg: '#ea580c', 
        text: '#ffffff', 
        label: 'SPORTS'
      };
      case 'health': return { 
        bg: '#7c3aed', 
        text: '#ffffff', 
        label: 'HEALTH'
      };
      case 'tech': return { 
        bg: '#0284c7', 
        text: '#ffffff', 
        label: 'TECH'
      };
      case 'local': return { 
        bg: '#0891b2', 
        text: '#ffffff', 
        label: 'LOCAL'
      };
      default: return { 
        bg: '#6b7280', 
        text: '#ffffff', 
        label: 'NEWS'
      };
    }
  };

  const categoryInfo = getCategoryInfo(card.category);
  
  // Generate realistic timestamps
  const getRealisticTime = () => {
    const now = new Date();
    const hours = Math.floor(Math.random() * 8) + 1;
    const pastTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    return pastTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Generate reading time
  const getReadingTime = () => {
    const words = card.summary.split(' ').length + (card.bullets?.length || 0) * 5;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid #e2e8f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
      e.currentTarget.style.borderColor = categoryInfo.bg;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.borderColor = '#e2e8f0';
    }}>
      {/* Category Badge */}
      <div style={{
        display: 'inline-block',
        padding: '10px 18px',
        marginBottom: '24px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: categoryInfo.bg,
        color: categoryInfo.text,
        borderRadius: '30px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        border: `2px solid ${categoryInfo.bg}20`
      }}>
        {categoryInfo.label}
      </div>
      
      {/* Headline */}
      <h2 className="headline-font" style={{
        fontSize: '24px',
        fontWeight: '600',
        lineHeight: '1.3',
        marginBottom: '20px',
        color: '#0f172a',
        letterSpacing: '-0.02em'
      }}>
        {card.headline}
      </h2>
      
      {/* Summary */}
      <p style={{
        color: '#4b5563',
        lineHeight: '1.7',
        marginBottom: '20px',
        flexGrow: 1,
        fontSize: '15px',
        fontWeight: '400'
      }}>
        {card.summary}
      </p>
      
      {/* Bullet Points */}
      {card.bullets && card.bullets.length > 0 && (
        <ul style={{ marginBottom: '20px', paddingLeft: '0', listStyle: 'none' }}>
          {card.bullets.map((bullet, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'baseline',
              fontSize: '14px',
              color: '#374151',
              marginBottom: '10px',
              lineHeight: '1.6',
              transition: 'color 0.2s ease'
            }}>
              <span style={{ 
                color: '#dc2626', 
                marginRight: '12px', 
                fontWeight: 'bold',
                fontSize: '14px',
                lineHeight: '1.6',
                flexShrink: 0
              }}>•</span>
              <span style={{ fontWeight: '400', flex: 1 }}>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
      
      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#6b7280',
        paddingTop: '24px',
        borderTop: '1px solid #e2e8f0',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '500', fontSize: '13px' }}>
            {getRealisticTime()}
          </span>
          <span style={{ 
            backgroundColor: '#f1f5f9',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#475569'
          }}>
            {getReadingTime()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <span style={{ fontSize: '16px' }}>🔖</span>
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <span style={{ fontSize: '16px' }}>📤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
