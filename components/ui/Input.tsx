'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    type = 'text',
    showPasswordToggle = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type;

    const inputId = props.id || `input-${generatedId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy = [props['aria-describedby'], error ? errorId : helperText ? helperId : null]
      .filter(Boolean)
      .join(' ') || undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={inputType}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-3 py-2.5',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'transition-colors duration-200',
              'text-gray-900 placeholder-gray-400 dark:text-slate-100 dark:placeholder-slate-500 dark:bg-slate-900 dark:border-slate-700',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
