import React from 'react';
import * as Icons from 'lucide-react';

interface BlockIconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

export const BlockIcon: React.FC<BlockIconProps> = ({
  name,
  size = 36,
  className = '',
  strokeWidth = 2.5,
  fill = '#FFFFFF',
}) => {
  // Lucide icons map
  const LucideIcon = (Icons as unknown as Record<string, React.FC<Icons.LucideProps>>)[name] || Icons.Star;

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <LucideIcon
        size={size}
        color="#2D2200"
        strokeWidth={strokeWidth}
        fill={fill}
        className="overflow-visible"
      />
    </div>
  );
};
