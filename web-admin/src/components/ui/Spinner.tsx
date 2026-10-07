import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', text }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} text-primary-600 animate-spin`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export const FullPageSpinner: React.FC<{ text?: string }> = ({ text = 'Đang tải...' }) => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <Spinner size="lg" text={text} />
  </div>
);
