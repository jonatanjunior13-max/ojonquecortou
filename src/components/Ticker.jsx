import React from 'react';
import './Ticker.css';

const Ticker = () => {
  const items = [
    { text: 'Leitura de Fio', emoji: '🌀' },
    { text: 'Nutrição Terapêutica', emoji: '🏺' },
    { text: 'Caiçara · BH', emoji: '📍' },
    { text: 'Avaliação 5 estrelas', emoji: '⭐' },
    { text: 'Educação real dos cachos', emoji: '💡' },
    { text: 'Atendimento exclusivo', emoji: '💙' },
  ];

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {[...items, ...items].map((item, index) => (
          <div key={index} className="ticker-item">
            <span className="ticker-emoji">{item.emoji}</span>
            <span className="ticker-text">{item.text}</span>
            <span className="ticker-dot">●</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
