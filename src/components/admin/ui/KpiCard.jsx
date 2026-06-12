import React from 'react';
import './KpiCard.css';

const KpiCard = ({ label, value, delta, deltaPositive, sparkline }) => (
  <div className="adm-kpi-card">
    <div className="adm-kpi-label">{label}</div>
    <div className="adm-kpi-value">{value}</div>
    {delta && (
      <div className={`adm-kpi-delta ${deltaPositive ? 'adm-kpi-delta--up' : 'adm-kpi-delta--down'}`}>
        {deltaPositive ? '▲' : '▼'} {delta}
      </div>
    )}
  </div>
);

export default KpiCard;
