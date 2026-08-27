'use client';

import React from 'react';
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';

type MetricTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'violet';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down';
  tone?: MetricTone;
  isCurrency?: boolean;
  currency?: string;
  locale?: string;
  className?: string;
}

const toneClasses: Record<MetricTone, {
  iconWrap: string;
  icon: string;
  value: string;
  trend: string;
}> = {
  slate: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
  blue: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-700 dark:text-slate-200',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
  emerald: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-700 dark:text-slate-200',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
  amber: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-700 dark:text-slate-200',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
  red: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-700 dark:text-slate-200',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
  indigo: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-700 dark:text-slate-200',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
  violet: {
    iconWrap: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-700 dark:text-slate-200',
    value: 'text-slate-900 dark:text-white',
    trend: 'text-slate-500',
  },
};

const toCompactCurrency = (amount: number, currency: string, locale: string): string => (
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
);

const getMoneyFontClass = (text: string): string => {
  if (text.length > 22) return 'text-base sm:text-lg';
  if (text.length > 16) return 'text-lg sm:text-xl';
  return 'text-2xl sm:text-3xl';
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  tone = 'slate',
  isCurrency = false,
  currency = 'KES',
  locale = 'en-KE',
  className,
}) => {
  const classes = toneClasses[tone];
  const numberValue = typeof value === 'number' ? value : Number.NaN;
  const canFormatAsMoney = isCurrency && Number.isFinite(numberValue);

  const fullValue = canFormatAsMoney
    ? formatCurrency(numberValue, currency, locale)
    : String(value);
  const compactMobileValue = canFormatAsMoney
    ? toCompactCurrency(numberValue, currency, locale)
    : fullValue;
  const useCompactMobile = canFormatAsMoney && fullValue.length > 14;
  const valueFontClass = canFormatAsMoney ? getMoneyFontClass(fullValue) : 'text-3xl';

  return (
    <div className={cn(
      'min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
      className
    )}>
      {(Icon || trend) && (
        <div className="flex items-start justify-between">
          {Icon ? (
            <span className={cn('inline-flex rounded-xl p-2.5', classes.iconWrap)}>
              <Icon className={cn('h-4 w-4', classes.icon)} />
            </span>
          ) : (
            <span />
          )}
          {trend ? (
            <span className={classes.trend}>
              {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </span>
          ) : null}
        </div>
      )}

      <p className={cn(
        'text-xs font-semibold uppercase tracking-wider text-slate-500',
        (Icon || trend) ? 'mt-4' : ''
      )}>
        {label}
      </p>

      <p
        className={cn(
          'mt-1 font-bold leading-tight tabular-nums [overflow-wrap:anywhere] sm:hidden',
          classes.value,
          valueFontClass
        )}
        title={fullValue}
      >
        {useCompactMobile ? compactMobileValue : fullValue}
      </p>

      <p
        className={cn(
          'mt-1 hidden font-bold leading-tight tabular-nums [overflow-wrap:anywhere] sm:block',
          classes.value,
          valueFontClass
        )}
        title={fullValue}
      >
        {fullValue}
      </p>

      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
};

