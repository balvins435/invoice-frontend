'use client';

import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Business } from '@/types';

interface ActiveBusinessSelectorProps {
  businesses: Business[];
  activeBusinessId: number | null;
  onChange: (businessId: number | null) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ActiveBusinessSelector({
  businesses,
  activeBusinessId,
  onChange,
  label = 'Business',
  helperText,
  placeholder = 'Select a business',
  className,
  disabled = false,
}: ActiveBusinessSelectorProps) {
  const showPlaceholder = businesses.length > 1;

  return (
    <div className={cn('flex min-w-[220px] flex-col gap-1.5', className)}>
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <select
          value={activeBusinessId ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue ? Number(nextValue) : null);
          }}
          disabled={disabled || !businesses.length}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {showPlaceholder ? <option value="">{placeholder}</option> : null}
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.display_name || business.business_name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      </div>
      {helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
