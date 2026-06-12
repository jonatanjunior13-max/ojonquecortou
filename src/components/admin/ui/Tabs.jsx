import React, { useState } from 'react';
import './Tabs.css';

const Tabs = ({ tabs, defaultTab, children }) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);
  return (
    <div className="adm-tabs">
      <div className="adm-tabs-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`adm-tab-btn ${active === tab.key ? 'active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.icon && <span className="adm-tab-icon">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="adm-tabs-content">
        {typeof children === 'function' ? children(active) : children}
      </div>
    </div>
  );
};

export default Tabs;
