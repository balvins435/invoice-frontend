'use client';

import React from 'react';

type SpinnerProps = {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
};

export function Spinner({ size = 16, className = '' }: SpinnerProps) {
  const resolvedSize = typeof size === 'number'
    ? size
    : size === 'sm'
      ? 14
      : size === 'lg'
        ? 24
        : 20;
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-emerald-500 border-t-transparent dark:border-emerald-400 ${className}`}
      style={{ width: resolvedSize, height: resolvedSize }}
    />
  );
}
