import React from 'react';

interface CloverIconProps {
  size?: string;
}

// Composite icon for Pick Clover action (clover with up arrow - picking UP from ground)
export const PickCloverIcon: React.FC<CloverIconProps> = ({ size = 'text-base' }) => (
  <span className={`inline-flex flex-col items-center leading-none ${size}`}>
    <span className="text-[0.6em]">↑</span>
    <span>🍀</span>
  </span>
);

// Composite icon for Place Clover action (clover with down arrow - placing DOWN onto ground)
export const PlaceCloverIcon: React.FC<CloverIconProps> = ({ size = 'text-base' }) => (
  <span className={`inline-flex flex-col items-center leading-none ${size}`}>
    <span>🍀</span>
    <span className="text-[0.6em]">↓</span>
  </span>
);
