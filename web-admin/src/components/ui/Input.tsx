import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  hint,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full border rounded-lg text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}
            ${leftIcon ? 'pl-10' : 'pl-3'}
            ${rightIcon ? 'pr-10' : 'pr-3'}
            py-2.5
            placeholder:text-gray-400
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
