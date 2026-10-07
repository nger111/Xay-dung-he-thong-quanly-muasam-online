import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full pl-3 pr-10 py-2.5 border rounded-lg text-sm appearance-none
            focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
            transition-all duration-200 bg-white
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
