import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  trend,
  subtitle,
}) => {
  const colors = {
    blue: {
      icon: 'bg-blue-100 text-blue-600',
      bg: 'from-blue-50 to-white',
    },
    green: {
      icon: 'bg-green-100 text-green-600',
      bg: 'from-green-50 to-white',
    },
    amber: {
      icon: 'bg-amber-100 text-amber-600',
      bg: 'from-amber-50 to-white',
    },
    red: {
      icon: 'bg-red-100 text-red-600',
      bg: 'from-red-50 to-white',
    },
    purple: {
      icon: 'bg-purple-100 text-purple-600',
      bg: 'from-purple-50 to-white',
    },
  };

  const c = colors[color];

  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-xl border border-gray-200 p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-400">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
