import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width = '100%', height = '1rem', radius, className = '' }) => (
  <div
    className={`adm-skeleton ${className}`}
    style={{ width, height, borderRadius: radius || 'var(--adm-radius-sm)' }}
  />
);

export const SkeletonCard = ({ lines = 3 }) => {
  // Use a pseudo-random value based on index to avoid impure function during render
  const pseudoRandomWidth = (index) => 70 + ((index * 13) % 25);

  return (
    <div className="adm-skeleton-card">
      <Skeleton height="1.2rem" width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="0.85rem" width={`${pseudoRandomWidth(i)}%`} />
      ))}
    </div>
  );
};

export default Skeleton;
