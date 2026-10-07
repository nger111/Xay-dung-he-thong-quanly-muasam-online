import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  size = 'sm',
  dot = false,
}) => {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-gray-500',
    purple: 'bg-purple-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
