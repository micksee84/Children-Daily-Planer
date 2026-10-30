import React from 'react';

interface SunshineLogoProps {
  className?: string;
  showWordmark?: boolean;
  height?: number;
}

export const SunshineLogo: React.FC<SunshineLogoProps> = ({
  className = '',
  height = 30,
}) => {
  return (
    <div className={`flex items-center select-none shrink-0 ${className}`}>
      <img
        // Black-and-white logo, cropped to its drawn edges so it sits exactly on the page margin.
        src={`${import.meta.env.BASE_URL}sb-logo-bw.svg`}
        alt="Sunshine Brigade"
        draggable={false}
        style={{ height: `${height}px`, width: 'auto' }}
        className="object-contain shrink-0"
        loading="eager"
      />
    </div>
  );
};
