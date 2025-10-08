import { Card } from './Card';
import type { Card as CardType } from '../lib/types';

interface NewsGridProps {
  cards: CardType[];
}

export function NewsGrid({ cards }: NewsGridProps) {
  if (cards.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center py-20">
          <p className="text-xl text-slate-400">No news available today</p>
          <p className="text-slate-500 mt-2">Please check back after 6:00 AM</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', 
        gap: '32px',
        alignItems: 'start'
      }}>
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
