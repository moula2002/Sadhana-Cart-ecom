import React from 'react';

const SkeletonGrid = ({ count = 6, wrapperClass = '' }) => {
  return (
    <div className={`skeleton-grid ${wrapperClass}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="skeleton-card"></div>
      ))}
    </div>
  );
};

export default SkeletonGrid;
