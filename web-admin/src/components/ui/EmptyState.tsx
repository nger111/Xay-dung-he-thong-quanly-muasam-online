import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description,
  icon,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {icon || <Inbox className="w-7 h-7 text-gray-400" />}
    </div>
    <h3 className="text-base font-medium text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
