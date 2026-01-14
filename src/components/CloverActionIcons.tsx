import React from 'react';

interface CloverIconProps {
  size?: string;
}

// Composite icon for Pick Clover action (clover with up arrow - picking UP from ground)
export const PickCloverIcon: React.FC<CloverIconProps> = ({ size = 'text-base' }) => (
  <span className={`inline-flex flex-col items-center justify-center leading-[1] ${size}`} style={{ verticalAlign: 'middle' }}>
    <span className="text-[0.5em] leading-[1]">↑</span>
    <span className="leading-[1]">🍀</span>
  </span>
);

// Composite icon for Place Clover action (clover with down arrow - placing DOWN onto ground)
export const PlaceCloverIcon: React.FC<CloverIconProps> = ({ size = 'text-base' }) => (
  <span className={`inline-flex flex-col items-center justify-center leading-[1] ${size}`} style={{ verticalAlign: 'middle' }}>
    <span className="leading-[1]">🍀</span>
    <span className="text-[0.5em] leading-[1]">↓</span>
  </span>
);
