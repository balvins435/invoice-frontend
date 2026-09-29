'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvoiceTemplate } from '@/types';
import { TemplatePreview } from './TemplatePreview';

const GRID_CLASSES: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

type TemplatePickerProps = {
  templates: InvoiceTemplate[];
  value: string;
  onChange: (id: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
};

export const TemplatePicker = ({
  templates,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  columns = 4,
  className,
}: TemplatePickerProps) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-10 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400',
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Invoice template"
      className={cn('grid gap-4', GRID_CLASSES[columns] ?? GRID_CLASSES[4], className)}
    >
      {templates.map((template) => {
        const selected = template.id === value;

        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(template.id)}
            className={cn(
              'group relative flex flex-col rounded-2xl border p-3 text-left transition-all',
              selected
                ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10 dark:border-white dark:bg-gray-800'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <TemplatePreview template={template} />
            <span className="mt-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {template.name}
              </span>
              {selected && (
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </span>
            <span className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {template.description}
            </span>
          </button>
        );
      })}
    </div>
  );
};