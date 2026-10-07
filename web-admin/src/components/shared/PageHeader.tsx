import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumb,
}) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      {breadcrumb && (
        <nav className="flex items-center gap-2 mb-1">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-300">/</span>}
              <span className={`text-xs ${index === breadcrumb.length - 1 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                {item}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);
