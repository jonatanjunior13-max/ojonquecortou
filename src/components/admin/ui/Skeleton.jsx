import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width = '100%', height = '1rem', radius, className = '' }) => (
  <div
    className={`adm-skeleton ${className}`}
    style={{ width, height, borderRadius: radius || 'var(--adm-radius-sm)' }}
  />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="adm-skeleton-card">
    <Skeleton height="1.2rem" width="60%" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="0.85rem" width={`${70 + Math.random() * 25}%`} />
    ))}
  </div>
);

export default Skeleton;
