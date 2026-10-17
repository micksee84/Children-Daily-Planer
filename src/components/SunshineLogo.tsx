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
    <div className={`flex items-center gap-2 select-none shrink-0 ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}sb-logo.svg`}
        alt="Sunshine Brigade"
        style={{ height: `${height}px`, width: 'auto' }}
        className="object-contain shrink-0"
        loading="eager"
      />
    </div>
  );
};
